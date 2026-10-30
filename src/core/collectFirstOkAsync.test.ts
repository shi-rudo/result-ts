import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err } from './result';
import { InvalidResultStateError } from '../errors';
import { collectFirstOkAsync } from './collectFirstOkAsync';

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

describe('collectFirstOkAsync', () => {
    it('returns first Ok Result', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.resolve(err('error2')),
            Promise.resolve(ok(42)),
            Promise.resolve(err('error3'))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('collects all Errors if no Ok found', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.resolve(err('error2')),
            Promise.resolve(err('error3'))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'error2', 'error3']);
        }
    });

    it('treats Promise rejections as Errors', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.reject('promise error'),
            Promise.resolve(ok(42))
        ];
        const result = await collectFirstOkAsync(promises);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('returns empty Error array for empty Promise array', async () => {
        const promises: Promise<Result<number, string>>[] = [];
        const result = await collectFirstOkAsync(promises);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual([]);
        }
    });

    it('supports Thunks and is truly sequential', async () => {
        const t1 = vi.fn(async () => err('error1'));
        const t2 = vi.fn(async () => ok(42));
        const t3 = vi.fn(async () => ok(99));

        const result = await collectFirstOkAsync([t1, t2, t3] as const);

        expect(t1).toHaveBeenCalledTimes(1);
        expect(t2).toHaveBeenCalledTimes(1);
        expect(t3).toHaveBeenCalledTimes(0);

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

        await expect(collectFirstOkAsync([malformed])).rejects.toBeInstanceOf(InvalidResultStateError);
    });

    it('rejects with InvalidResultStateError when an input fulfils with a non-Result', async () => {
        const notAResult = Promise.resolve(undefined) as unknown as Promise<Result<number, string>>;

        await expect(collectFirstOkAsync([notAResult, Promise.resolve(ok(1))])).rejects.toBeInstanceOf(
            InvalidResultStateError
        );
        await expect(collectFirstOkAsync([notAResult, Promise.resolve(ok(1))])).rejects.toThrow(
            'input 0 fulfilled with undefined, not a Result'
        );
    });

    it('rethrows synchronous thunk errors as programmer errors', async () => {
        const bug = new Error('bug');
        const throwingThunk = () => {
            throw bug;
        };

        await expect(collectFirstOkAsync([throwingThunk])).rejects.toBe(bug);
    });

    it('collects the raw rejection reason without errorMapper', async () => {
        const promises = [
            Promise.reject('promise error'),
            Promise.resolve(err('error2')),
        ];

        const result = await collectFirstOkAsync(promises);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['promise error', 'error2']);
        }
    });

    it('maps rejection reasons through errorMapper and leaves Err values untouched', async () => {
        const promises = [
            Promise.resolve(err('error1')),
            Promise.reject(new Error('down')),
            Promise.resolve(err('error3')),
        ];

        const result = await collectFirstOkAsync(promises, reason => `rejected: ${(reason as Error).message}`);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'rejected: down', 'error3']);
        }
    });

    it('rethrows errorMapper failures as programmer errors', async () => {
        const bug = new Error('mapper bug');
        const promises = [Promise.reject('promise error')];

        await expect(collectFirstOkAsync(promises, () => { throw bug; })).rejects.toBe(bug);
    });

    it('handles the late rejection of a started input that follows the first Ok', async () => {
        const late = deferred<Result<number, string>>();
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        const result = await collectFirstOkAsync([Promise.resolve(ok(1)), late.promise] as const);
        late.reject('late rejection');

        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(result.isOk()).toBe(true);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('handles the late rejection of a started input after an input fulfils with a non-Result', async () => {
        const notAResult = Promise.resolve(undefined) as unknown as Promise<Result<number, string>>;
        const late = deferred<Result<number, string>>();
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        await expect(collectFirstOkAsync([notAResult, late.promise] as const)).rejects.toBeInstanceOf(InvalidResultStateError);
        late.reject('late rejection');

        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('handles the late rejection of a started input after a thunk throws', async () => {
        const bug = new Error('bug');
        const late = deferred<Result<number, string>>();
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        await expect(collectFirstOkAsync([() => { throw bug; }, late.promise] as const)).rejects.toBe(bug);
        late.reject('late rejection');

        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('handles the late rejection of a started input after errorMapper throws', async () => {
        const bug = new Error('mapper bug');
        const late = deferred<Result<number, string>>();
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        await expect(collectFirstOkAsync([Promise.reject('promise error'), late.promise] as const, () => { throw bug; })).rejects.toBe(bug);
        late.reject('late rejection');

        await new Promise(resolve => setTimeout(resolve, 0));
        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('collects a rejection that arrives while it still awaits an earlier input, without an unhandled rejection', async () => {
        const slow = deferred<Result<number, string>>();
        const fast = Promise.reject('fast') as Promise<Result<number, string>>;
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        const pending = collectFirstOkAsync([slow.promise, fast] as const);
        await new Promise(resolve => setTimeout(resolve, 0));
        slow.resolve(err('slow'));
        const result = await pending;

        process.removeListener('unhandledRejection', unhandled);
        expect(unhandled).not.toHaveBeenCalled();
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['slow', 'fast']);
        }
    });

    it('handles the late rejection of an unreached promise from another realm', async () => {
        const foreign = runInNewContext(
            'new Promise((resolve, reject) => setTimeout(() => reject("foreign"), 0))',
            { setTimeout },
        ) as Promise<Result<number, string>>;
        const unhandled = vi.fn();
        process.once('unhandledRejection', unhandled);

        const result = await collectFirstOkAsync([Promise.resolve(ok(1)), foreign] as const);

        await new Promise(resolve => setTimeout(resolve, 10));
        process.removeListener('unhandledRejection', unhandled);
        expect(result.isOk()).toBe(true);
        expect(unhandled).not.toHaveBeenCalled();
    });

    it('keeps its outcome when an unreached input from an untyped caller is a plain value or a thenable', async () => {
        const thenable = { then: vi.fn((resolve: (value: unknown) => void) => resolve(ok(3))) };
        const bug = new Error('bug');

        const result = await collectFirstOkAsync([Promise.resolve(ok(1)), ok(2), thenable] as never);

        expect(result.isOk()).toBe(true);
        await expect(collectFirstOkAsync([() => { throw bug; }, ok(5)] as never)).rejects.toBe(bug);
        expect(thenable.then).not.toHaveBeenCalled();
    });

    it('does not start a thunk that follows the first Ok', async () => {
        const later = vi.fn(async () => ok(2));

        await collectFirstOkAsync([Promise.resolve(ok(1)), later] as const);

        expect(later).not.toHaveBeenCalled();
    });
});
