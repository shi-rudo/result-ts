import { describe, expect, it } from 'vitest';

import type { Result } from './result';
import { err, ok } from './result';
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
    it('gibt das erste Ok nach Completion-Time zurück (race)', async () => {
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

    it('sammelt Errors in Input-Reihenfolge, wenn kein Ok gefunden wird', async () => {
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

    it('unterstützt Thunks', async () => {
        const result = await collectFirstOkRaceAsync([() => err('error1'), () => Promise.resolve(ok(42))] as const);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const value: number = result.value;
            expect(value).toBe(42);
        }
    });
});

