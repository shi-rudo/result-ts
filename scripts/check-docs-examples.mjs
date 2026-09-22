import { mkdtemp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tempDir = await mkdtemp(join(tmpdir(), 'result-docs-examples-'));

async function listMarkdownFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async entry => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return listMarkdownFiles(path);
        return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
    }));

    return files.flat().sort();
}

const docs = [
    'README.md',
    ...(await listMarkdownFiles(join(repoRoot, 'docs'))).map(path => relative(repoRoot, path)),
    ...(await listMarkdownFiles(join(repoRoot, 'skills'))).map(path => relative(repoRoot, path)),
];

function extractTypeScriptBlocks(markdown, sourcePath) {
    const blocks = [];
    const fencePattern = /^```(ts|typescript)(?:[ \t]+([^\n]*))?\n([\s\S]*?)^```/gm;
    let match;

    while ((match = fencePattern.exec(markdown)) !== null) {
        const meta = match[2] ?? '';
        if (meta.includes('docs-check:skip')) continue;

        const beforeFence = markdown.slice(0, match.index);
        const line = beforeFence.split('\n').length;
        blocks.push({
            sourcePath,
            line,
            code: match[3],
        });
    }

    return blocks;
}

// Every entry of the API reference is a list item that opens with the signature
// of the export. A name in that position claims an export; the prose around it
// does not, so only the first span of an item is checked. A span that starts
// with a dot documents a method of Result, not a module export.
function extractApiEntryNames(markdown, sourcePath) {
    const names = [];

    markdown.split('\n').forEach((text, index) => {
        const item = /^\s*-\s+`([^`]+)`/.exec(text);
        if (!item) return;

        const span = item[1];
        if (span.startsWith('.')) return;

        const entry = /^([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?\s*[(<]/.exec(span);
        if (!entry) return;

        names.push({ sourcePath, line: index + 1, name: entry[1], member: entry[2] });
    });

    return names;
}

// The class table and the code list of errors.md claim to be the reference of
// the exported error classes. A new class that nobody adds there stays
// invisible, which no snippet can catch.
async function checkErrorReferenceIsComplete() {
    const source = await readFile(join(repoRoot, 'src/errors.ts'), 'utf8');
    const exported = [
        ...source.matchAll(/^export class (\w+)/gm),
        ...source.matchAll(/^export const (ERR_\w+)/gm),
    ].map(match => match[1]);

    const reference = await readFile(join(repoRoot, 'docs/api/errors.md'), 'utf8');
    const missing = exported.filter(name => !reference.includes(`\`${name}\``));

    if (missing.length > 0) {
        throw new Error(`docs/api/errors.md does not mention: ${missing.join(', ')}`);
    }
}

function rewriteSnippetLocations(output, sourceByLocation) {
    return output.replaceAll(/^(\S+)\((\d+),\d+\)/gm, (match, file, line) => {
        return sourceByLocation.get(`${file.replaceAll('\\', '/')}:${line}`) ?? match;
    });
}

async function run(command, args) {
    try {
        return await exec(command, args, {
            cwd: tempDir,
            maxBuffer: 1024 * 1024,
        });
    } catch (error) {
        const output = [
            error.stdout,
            error.stderr,
        ].filter(Boolean).join('\n');
        throw new Error(`${command} ${args.join(' ')} failed\n${output}`);
    }
}

try {
    const scopedDir = join(tempDir, 'node_modules', '@shirudo');
    await mkdir(scopedDir, { recursive: true });
    await symlink(repoRoot, join(scopedDir, 'result'), 'dir');
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));

    await checkErrorReferenceIsComplete();

    const snippetPaths = [];
    const sourceByLocation = new Map();

    for (const doc of docs) {
        const markdown = await readFile(join(repoRoot, doc), 'utf8');
        const blocks = extractTypeScriptBlocks(markdown, doc);

        for (const [index, block] of blocks.entries()) {
            const snippetPath = join(tempDir, 'snippets', `${doc.replaceAll('/', '__')}.${index + 1}.ts`);
            await mkdir(dirname(snippetPath), { recursive: true });
            await writeFile(snippetPath, [
                `// Source: ${block.sourcePath}:${block.line}`,
                block.code,
                '',
            ].join('\n'));
            snippetPaths.push(relative(tempDir, snippetPath));
        }

        if (!doc.startsWith('docs/api/')) continue;

        // Every documented name must be importable from the root entry, which
        // re-exports the errors, operators and collections entries.
        const entryNames = extractApiEntryNames(markdown, doc);
        if (entryNames.length === 0) continue;

        // A documented member such as `Result.try(fn)` needs the value import, so
        // that `typeof` can prove the member exists. Every other name is checked
        // as a type import, which also covers the type-only exports.
        const namesWithMember = new Set(entryNames.filter(entry => entry.member).map(entry => entry.name));
        const lines = [];
        const locations = [];
        const imported = new Set();

        for (const entry of entryNames) {
            if (!imported.has(entry.name)) {
                imported.add(entry.name);
                const kind = namesWithMember.has(entry.name) ? 'import' : 'import type';
                lines.push(`${kind} { ${entry.name} } from '@shirudo/result';`);
                locations.push(`${entry.sourcePath}:${entry.line}`);
            }

            if (entry.member) {
                lines.push(`type Check_${entry.name}_${entry.member} = typeof ${entry.name}.${entry.member};`);
                locations.push(`${entry.sourcePath}:${entry.line}`);
            }
        }

        const snippetPath = join(tempDir, 'snippets', `${doc.replaceAll('/', '__')}.names.ts`);
        await mkdir(dirname(snippetPath), { recursive: true });
        await writeFile(snippetPath, [...lines, ''].join('\n'));

        const snippetRelativePath = relative(tempDir, snippetPath);
        locations.forEach((source, index) => {
            sourceByLocation.set(`${snippetRelativePath}:${index + 1}`, source);
        });
        snippetPaths.push(snippetRelativePath);
    }

    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            strict: true,
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            lib: ['ES2022', 'DOM'],
            skipLibCheck: false,
            noEmit: true,
        },
        include: snippetPaths,
    }, null, 2));

    try {
        await run('node', [join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']);
    } catch (error) {
        throw new Error(rewriteSnippetLocations(error.message, sourceByLocation));
    }
} finally {
    await rm(tempDir, { recursive: true, force: true });
}
