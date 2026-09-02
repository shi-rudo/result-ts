import { describe, expect, it, vi } from 'vitest';

import type { Result } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { collectFirstOkParallelAsync } from './collectFirstOkParallelAsync';

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('collectFirstOkParallelAsync', () => {
    it('returns the first Ok by completion time (race)', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkParallelAsync([p1.promise, p2.promise] as const);

        p2.resolve(ok(42));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }

        p1.resolve(err('error1'));
    });

    it('prefers the first fulfilled Ok over input order', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkParallelAsync([p1.promise, p2.promise] as const);

        p2.resolve(ok(2));
        p1.resolve(ok(1));

        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(2);
        }
    });

    it('collects Errors in input order if no Ok is found', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();
        const p3 = deferred<Result<number, string>>();

        const pending = collectFirstOkParallelAsync([p1.promise, p2.promise, p3.promise] as const);

        p2.reject('promise error');
        p3.resolve(err('error3'));
        p1.resolve(err('error1'));

        const result = await pending;

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'promise error', 'error3']);
        }
    });

    it('supports Thunks', async () => {
        const result = await collectFirstOkParallelAsync([() => err('error1'), () => Promise.resolve(ok(42))] as const);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }
    });

    it('rethrows malformed fulfilled values as programmer errors', async () => {
        const malformed = Promise.resolve({
            isOk: () => false,
            isErr: () => false,
        }) as unknown as Promise<Result<number, string>>;

        await expect(collectFirstOkParallelAsync([malformed])).rejects.toBeInstanceOf(InvalidResultStateError);
    });

    it('collects the raw rejection reason without errorMapper', async () => {
        const result = await collectFirstOkParallelAsync([
            Promise.reject('promise error'),
            Promise.resolve(err('error2')),
        ] as const);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['promise error', 'error2']);
        }
    });

    it('maps rejection reasons through errorMapper and leaves Err values untouched', async () => {
        const result = await collectFirstOkParallelAsync(
            [
                Promise.resolve(err('error1')),
                Promise.reject(new Error('down')),
                Promise.resolve(err('error3')),
            ] as const,
            reason => `rejected: ${(reason as Error).message}`,
        );

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'rejected: down', 'error3']);
        }
    });

    it('rethrows errorMapper failures as programmer errors', async () => {
        const bug = new Error('mapper bug');

        await expect(
            collectFirstOkParallelAsync([Promise.reject('promise error')] as const, () => { throw bug; }),
        ).rejects.toBe(bug);
    });

    it('rethrows synchronous thunk errors as programmer errors', async () => {
        const bug = new Error('bug');
        const throwingThunk = () => {
            throw bug;
        };

        await expect(collectFirstOkParallelAsync([throwingThunk])).rejects.toBe(bug);
    });

    it('rethrows a synchronous thunk error even when another input yields Ok', async () => {
        const bug = new Error('bug');
        const throwingThunk = () => {
            throw bug;
        };

        await expect(
            collectFirstOkParallelAsync([throwingThunk, () => Promise.resolve(ok(1))] as const),
        ).rejects.toBe(bug);
    });

    it('abandons already started attempts without an unhandled rejection when a later thunk throws', async () => {
        const bug = new Error('bug');
        const late = deferred<Result<number, string>>();
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        await expect(
            collectFirstOkParallelAsync([() => late.promise, () => { throw bug; }] as const),
        ).rejects.toBe(bug);
        late.reject('late rejection');

        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });
});
