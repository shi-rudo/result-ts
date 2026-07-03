// Generates src/core/pipeable.ts — the pipe()/pipeAsync() overload ladders.
// Usage: pnpm generate:pipeable [--check]
//
// --check exits non-zero if the file on disk differs from the generated
// output (useful in CI to prevent hand edits from drifting).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const MAX_OPERATORS = 20;
const LETTERS = Array.from({ length: MAX_OPERATORS + 1 }, (_, i) => String.fromCharCode(65 + i)); // A..U

const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'core', 'pipeable.ts');

const pipeOverload = (n) => {
    const typeParams = LETTERS.slice(0, n + 1).join(', ');
    if (n === 0) return `    pipe<A>(this: A): A;`;

    const params = ['this: A'];
    for (let i = 0; i < n; i++) {
        const name = LETTERS[i].toLowerCase() + LETTERS[i + 1].toLowerCase();
        params.push(`${name}: UnaryFunction<${LETTERS[i]}, ${LETTERS[i + 1]}>`);
    }
    const ret = LETTERS[n];

    if (n <= 3) return `    pipe<${typeParams}>(${params.join(', ')}): ${ret};`;
    return `    pipe<${typeParams}>(\n${params.map((p) => `        ${p}`).join(',\n')}\n    ): ${ret};`;
};

const pipeAsyncOverload = (n) => {
    const typeParams = LETTERS.slice(0, n + 1).join(', ');
    if (n === 0) return `    pipeAsync<A>(this: A): Promise<A>;`;

    const params = ['this: A'];
    for (let i = 0; i < n; i++) {
        const name = LETTERS[i].toLowerCase() + LETTERS[i + 1].toLowerCase();
        const input = i === 0 ? LETTERS[i] : `Awaited<${LETTERS[i]}>`;
        params.push(`${name}: UnaryFunction<${input}, ${LETTERS[i + 1]}>`);
    }
    const ret = `Promise<Awaited<${LETTERS[n]}>>`;

    if (n <= 2) return `    pipeAsync<${typeParams}>(${params.join(', ')}): ${ret};`;
    return `    pipeAsync<${typeParams}>(\n${params.map((p) => `        ${p}`).join(',\n')}\n    ): ${ret};`;
};

const range = Array.from({ length: MAX_OPERATORS + 1 }, (_, i) => i);

const content = `// AUTO-GENERATED FILE — do not edit by hand.
// Regenerate with: pnpm generate:pipeable (scripts/generate-pipeable.mjs)

export type UnaryFunction<Input, Output> = (input: Input) => Output;
export type Awaitable<T> = T | Promise<T>;

export abstract class Pipeable {
    // -------------------------------------------------------------------------
    // PIPE (Synchron)
    // -------------------------------------------------------------------------

${range.map(pipeOverload).join('\n')}

    pipe(this: any, ...ops: Array<UnaryFunction<any, any>>): any {
        let ret: any = this;
        for (const op of ops) {
            ret = op(ret);
        }
        return ret;
    }

    // -------------------------------------------------------------------------
    // PIPE ASYNC (Asynchron)
    // -------------------------------------------------------------------------

${range.map(pipeAsyncOverload).join('\n')}

    async pipeAsync(this: any, ...ops: Array<(a: any) => Awaitable<any>>): Promise<any> {
        let ret: any = this;
        for (const op of ops) {
            ret = await op(ret);
        }
        return ret;
    }
}
`;

if (process.argv.includes('--check')) {
    const current = readFileSync(target, 'utf8');
    if (current !== content) {
        console.error('src/core/pipeable.ts is out of sync with scripts/generate-pipeable.mjs. Run: pnpm generate:pipeable');
        process.exit(1);
    }
    console.log('pipeable.ts is in sync.');
} else {
    writeFileSync(target, content);
    console.log(`Generated ${target} (${content.split('\n').length} lines).`);
}
