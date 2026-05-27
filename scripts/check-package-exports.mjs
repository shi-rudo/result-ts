import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tempDir = await mkdtemp(join(tmpdir(), 'result-package-exports-'));

async function run(command, args, options = {}) {
    try {
        return await exec(command, args, {
            cwd: tempDir,
            maxBuffer: 1024 * 1024,
            ...options,
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

    await run('node', ['--input-type=module', '-e', `
        import { Result } from '@shirudo/result';
        import { InvalidResultStateError } from '@shirudo/result/errors';
        import { map } from '@shirudo/result/operators';
        import { sequence } from '@shirudo/result/collections';

        if (Result.ok(1).pipe(map(value => value + 1)).unwrap() !== 2) {
            throw new Error('root/operators ESM export failed');
        }
        if (typeof InvalidResultStateError !== 'function') {
            throw new Error('errors ESM export failed');
        }
        if (!sequence([Result.ok(1)]).isOk()) {
            throw new Error('collections ESM export failed');
        }
    `]);

    await run('node', ['-e', `
        const { Result } = require('@shirudo/result');
        const { InvalidResultStateError } = require('@shirudo/result/errors');
        const { map } = require('@shirudo/result/operators');
        const { sequence } = require('@shirudo/result/collections');

        if (Result.ok(1).pipe(map(value => value + 1)).unwrap() !== 2) {
            throw new Error('root/operators CJS export failed');
        }
        if (typeof InvalidResultStateError !== 'function') {
            throw new Error('errors CJS export failed');
        }
        if (!sequence([Result.ok(1)]).isOk()) {
            throw new Error('collections CJS export failed');
        }
    `]);

    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            strict: true,
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            skipLibCheck: false,
            noEmit: true,
        },
        include: ['consumer.ts'],
    }, null, 2));

    await writeFile(join(tempDir, 'consumer.ts'), `
        import { Result, type Result as ResultType } from '@shirudo/result';
        import { InvalidResultStateError } from '@shirudo/result/errors';
        import { map } from '@shirudo/result/operators';
        import { sequence } from '@shirudo/result/collections';

        const result: ResultType<number, string> = Result.ok(1);
        const mapped: ResultType<number, string> = result.pipe(map(value => value + 1));
        const sequenced: ResultType<[number], string> = sequence([mapped] as const);
        const error = new InvalidResultStateError('consumer');

        void sequenced;
        void error;
    `);

    await run('node', [join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']);
} finally {
    await rm(tempDir, { recursive: true, force: true });
}
