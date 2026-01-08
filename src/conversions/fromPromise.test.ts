import { describe, expect, it } from 'vitest';

import { ok, err } from '../index';
import { fromPromise } from './fromPromise';

describe('fromPromise', () => {
    describe('resolved Promises', () => {
        it('returns Ok for immediately resolved Promise', async () => {
            const promise = Promise.resolve(42);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(42));
        });

        it('returns Ok for async resolved Promise', async () => {
            const promise = new Promise<number>(resolve => {
                setTimeout(() => resolve(42), 1);
            });
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(42));
        });

        it('returns Ok with undefined value', async () => {
            const promise = Promise.resolve(undefined);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(undefined));
        });

        it('returns Ok with null value', async () => {
            const promise = Promise.resolve(null);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(null));
        });

        it('returns Ok with complex objects', async () => {
            const data = { user: 'alice', items: [1, 2, 3] };
            const promise = Promise.resolve(data);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(data));
        });
    });

    describe('rejected Promises', () => {
        it('returns Err for immediately rejected Promise', async () => {
            const promise = Promise.reject('error message');
            const result = await fromPromise(promise);
            expect(result).toEqual(err('error message'));
        });

        it('returns Err for async rejected Promise', async () => {
            const promise = new Promise<never>((_, reject) => {
                setTimeout(() => reject('async error'), 1);
            });
            const result = await fromPromise(promise);
            expect(result).toEqual(err('async error'));
        });

        it('returns Err with Error objects', async () => {
            const error = new Error('database connection failed');
            const promise = Promise.reject(error);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(error));
        });

        it('returns Err with undefined error', async () => {
            const promise = Promise.reject(undefined);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(undefined));
        });

        it('returns Err with null error', async () => {
            const promise = Promise.reject(null);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(null));
        });

        it('returns Err with complex error objects', async () => {
            const error = { code: 500, message: 'Internal Server Error', details: {} };
            const promise = Promise.reject(error);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(error));
        });
    });

    describe('errorMapper', () => {
        it('applies errorMapper to string errors', async () => {
            const promise = Promise.reject('raw error');
            const result = await fromPromise(promise, (e) => `mapped: ${e}`);
            expect(result).toEqual(err('mapped: raw error'));
        });

        it('applies errorMapper to Error objects', async () => {
            const promise = Promise.reject(new Error('original error'));
            const result = await fromPromise(promise, (e) => `mapped: ${(e as Error).message}`);
            expect(result).toEqual(err('mapped: original error'));
        });

        it('applies errorMapper to undefined', async () => {
            const promise = Promise.reject(undefined);
            const result = await fromPromise(promise, (e) => `mapped: ${String(e)}`);
            expect(result).toEqual(err('mapped: undefined'));
        });

        it('applies errorMapper to null', async () => {
            const promise = Promise.reject(null);
            const result = await fromPromise(promise, (e) => `mapped: ${String(e)}`);
            expect(result).toEqual(err('mapped: null'));
        });

        it('applies errorMapper to complex objects', async () => {
            const error = { code: 404, message: 'Not Found' };
            const promise = Promise.reject(error);
            const result = await fromPromise(promise, (e) => `HTTP ${(e as any).code}: ${(e as any).message}`);
            expect(result).toEqual(err('HTTP 404: Not Found'));
        });

        it('errorMapper can throw errors itself', async () => {
            const promise = Promise.reject('original error');
            const result = await fromPromise(promise, () => {
                throw new Error('mapper error');
            });
            expect(result).toEqual(err(new Error('mapper error')));
        });
    });

    describe('TypeScript Generics', () => {
        it('works with explicit type parameters', async () => {
            const promise: Promise<string> = Promise.resolve('hello');
            const result = await fromPromise<string, Error>(promise);
            expect(result).toEqual(ok('hello'));
        });

        it('infers types correctly', async () => {
            const promise = Promise.resolve(42);
            const result = await fromPromise(promise);
            // TypeScript should infer result as Result<number, unknown>
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const value: number = result.value;
                expect(value).toBe(42);
            }
        });
    });

    describe('Edge Cases', () => {
        it('handles already resolved promises correctly', async () => {
            const resolvedPromise = Promise.resolve('already resolved');
            // Awaiting multiple times should work
            const result1 = await fromPromise(resolvedPromise);
            const result2 = await fromPromise(resolvedPromise);
            expect(result1).toEqual(ok('already resolved'));
            expect(result2).toEqual(ok('already resolved'));
        });

        it('handles already rejected promises correctly', async () => {
            const rejectedPromise = Promise.reject('already rejected');
            const result1 = await fromPromise(rejectedPromise);
            const result2 = await fromPromise(rejectedPromise);
            expect(result1).toEqual(err('already rejected'));
            expect(result2).toEqual(err('already rejected'));
        });
    });
});
