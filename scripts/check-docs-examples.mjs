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

    const snippetPaths = [];

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

    await run('node', [join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']);
} finally {
    await rm(tempDir, { recursive: true, force: true });
}
