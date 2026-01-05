import { describe, expect, it } from 'vitest';

import type { Result } from '../index';
import { err, ok } from '../index';
import { collectFirstOkRaceAsync } from './collectFirstOkRaceAsync';

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

describe('collectFirstOkRaceAsync', () => {
    it('returns the first Ok by completion time (race)', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([p1.promise, p2.promise] as const);

        p2.resolve(ok(42));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }

        p1.resolve(err('error1'));
    });

    it('collects errors in input order when no Ok is found', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();
        const p3 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([p1.promise, p2.promise, p3.promise] as const);

        p2.reject('promise error');
        p3.resolve(err('error3'));
        p1.resolve(err('error1'));

        const result = await pending;

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'promise error', 'error3']);
        }
    });

    it('supports thunks', async () => {
        const result = await collectFirstOkRaceAsync([() => err('error1'), () => Promise.resolve(ok(42))] as const);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }
    });

    it('returns empty error array for empty input array', async () => {
        const result = await collectFirstOkRaceAsync([] as const);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual([]);
        }
    });

    it('ignores errors after first Ok is found (done flag)', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();
        const p3 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([p1.promise, p2.promise, p3.promise] as const);

        // First Ok resolves
        p2.resolve(ok(42));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }

        // These should be ignored because done is true
        p1.resolve(err('error1'));
        p3.resolve(err('error3'));
    });

    it('handles thunks that return promises', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([
            () => p1.promise,
            () => p2.promise
        ] as const);

        p2.resolve(ok(100));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(100);
        }

        p1.resolve(err('error1'));
    });

    it('handles the unreachable case (neither Ok nor Err)', async () => {
        // Create a malformed Result that bypasses type checking
        const malformedResult = {
            isOk: () => false,
            isErr: () => false,
            value: undefined,
            error: undefined,
        } as unknown as Result<number, string>;

        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([p1.promise, p2.promise] as const);

        p1.resolve(malformedResult);
        p2.resolve(err('error2'));

        const result = await pending;

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            // Should contain the error from the unreachable case
            expect(result.error.length).toBe(2);
            expect(result.error[0]).toBeInstanceOf(Error);
            expect((result.error[0] as Error).message).toContain('Unreachable');
            expect(result.error[1]).toBe('error2');
        }
    });

    it('handles promise rejections in thunks', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([
            () => p1.promise,
            () => Promise.reject('thunk rejection')
        ] as const);

        p1.resolve(ok(200));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(200);
        }
    });

    it('handles all errors when no Ok is found and some are rejected promises', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();
        const p3 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([
            p1.promise,
            p2.promise,
            p3.promise
        ] as const);

        p1.resolve(err('error1'));
        p2.reject('promise rejection');
        p3.resolve(err('error3'));

        const result = await pending;

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['error1', 'promise rejection', 'error3']);
        }
    });

    it('handles mixed promises and thunks', async () => {
        const p1 = deferred<Result<number, string>>();
        const p2 = deferred<Result<number, string>>();

        const pending = collectFirstOkRaceAsync([
            p1.promise,
            () => p2.promise
        ] as const);

        p2.resolve(ok(300));
        const result = await pending;

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(300);
        }

        p1.resolve(err('error1'));
    });
});
