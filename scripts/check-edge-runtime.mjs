import { readdir, readFile } from 'node:fs/promises';
import { builtinModules } from 'node:module';
import { extname } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);
const forbiddenBuiltins = new Set(
    builtinModules.flatMap((name) => [name, name.replace(/^node:/, ''), `node:${name.replace(/^node:/, '')}`])
);
const forbiddenGlobals = /\b(?:Buffer|process|__dirname|__filename|require)\b/;
const staticSpecifierPattern = /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
const dynamicSpecifierPattern = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

const fail = (message) => {
    throw new Error(`Edge runtime compatibility check failed: ${message}`);
};

const assert = (condition, message) => {
    if (!condition) fail(message);
};

const readModuleFiles = async () => {
    const entries = await readdir(distDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && extname(entry.name) === '.mjs')
        .map((entry) => new URL(entry.name, distDir));
};

const assertNoNodeRuntimeDependencies = async (fileUrl) => {
    const source = await readFile(fileUrl, 'utf8');
    const moduleName = fileUrl.pathname.split('/').at(-1);

    for (const pattern of [staticSpecifierPattern, dynamicSpecifierPattern]) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
            const specifier = match[1];
            if (forbiddenBuiltins.has(specifier)) {
                fail(`${moduleName} imports Node builtin "${specifier}"`);
            }
        }
    }

    const forbiddenGlobal = forbiddenGlobals.exec(source);
    if (forbiddenGlobal) {
        fail(`${moduleName} references Node global "${forbiddenGlobal[0]}"`);
    }
};

const assertPublicApiWorks = async () => {
    const pkg = await import(new URL('../dist/index.mjs', import.meta.url).href);
    const { Result, err, isResult, map, matchTag, ok, task } = pkg;

    const okResult = Result.ok(2);
    const errResult = Result.err({ type: 'network', retryAfter: 30 });

    assert(isResult(okResult), 'Result.ok() must produce a valid Result');
    assert(isResult(errResult), 'Result.err() must produce a valid Result');
    assert(okResult.isOk() && okResult.value === 2, 'Ok narrowing must work');
    assert(errResult.isErr() && errResult.error.type === 'network', 'Err narrowing must work');

    const mapped = okResult.pipe(map((value) => value + 1));
    assert(mapped.isOk() && mapped.value === 3, 'instance map() must work');

    const recovered = await Result.fromPromise(Promise.reject(new Error('boom')), (error) => ({
        type: 'mapped',
        message: error instanceof Error ? error.message : String(error),
    }));
    assert(recovered.isErr() && recovered.error.message === 'boom', 'Result.fromPromise() must map rejections');

    const tagged = matchTag(errResult, 'type', {
        network: (error) => error.retryAfter,
    });
    assert(tagged === 30, 'matchTag() must work');

    const generated = await task(function* () {
        const value = yield* ok(1);
        return value + 1;
    });
    assert(generated.isOk() && generated.value === 2, 'task() must work');

    const normalized = err('fallback').matchErr().otherwise(() => ok('recovered'));
    assert(normalized.isOk() && normalized.value === 'recovered', 'matchErr() recovery must work');
};

for (const file of await readModuleFiles()) {
    await assertNoNodeRuntimeDependencies(file);
}

await assertPublicApiWorks();
