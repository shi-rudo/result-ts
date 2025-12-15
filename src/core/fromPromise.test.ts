import { describe, expect, it } from 'vitest';

import { ok, err } from './result';
import { fromPromise } from './fromPromise';

describe('fromPromise', () => {
    describe('resolved Promises', () => {
        it('gibt Ok bei sofort resolved Promise', async () => {
            const promise = Promise.resolve(42);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(42));
        });

        it('gibt Ok bei async resolved Promise', async () => {
            const promise = new Promise<number>(resolve => {
                setTimeout(() => resolve(42), 1);
            });
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(42));
        });

        it('gibt Ok mit undefined Wert', async () => {
            const promise = Promise.resolve(undefined);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(undefined));
        });

        it('gibt Ok mit null Wert', async () => {
            const promise = Promise.resolve(null);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(null));
        });

        it('gibt Ok mit komplexen Objekten', async () => {
            const data = { user: 'alice', items: [1, 2, 3] };
            const promise = Promise.resolve(data);
            const result = await fromPromise(promise);
            expect(result).toEqual(ok(data));
        });
    });

    describe('rejected Promises', () => {
        it('gibt Err bei sofort rejected Promise', async () => {
            const promise = Promise.reject('error message');
            const result = await fromPromise(promise);
            expect(result).toEqual(err('error message'));
        });

        it('gibt Err bei async rejected Promise', async () => {
            const promise = new Promise<never>((_, reject) => {
                setTimeout(() => reject('async error'), 1);
            });
            const result = await fromPromise(promise);
            expect(result).toEqual(err('async error'));
        });

        it('gibt Err mit Error-Objekten', async () => {
            const error = new Error('database connection failed');
            const promise = Promise.reject(error);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(error));
        });

        it('gibt Err mit undefined Error', async () => {
            const promise = Promise.reject(undefined);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(undefined));
        });

        it('gibt Err mit null Error', async () => {
            const promise = Promise.reject(null);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(null));
        });

        it('gibt Err mit komplexen Error-Objekten', async () => {
            const error = { code: 500, message: 'Internal Server Error', details: {} };
            const promise = Promise.reject(error);
            const result = await fromPromise(promise);
            expect(result).toEqual(err(error));
        });
    });

    describe('errorMapper', () => {
        it('wendet errorMapper auf string Errors an', async () => {
            const promise = Promise.reject('raw error');
            const result = await fromPromise(promise, (e) => `mapped: ${e}`);
            expect(result).toEqual(err('mapped: raw error'));
        });

        it('wendet errorMapper auf Error-Objekte an', async () => {
            const promise = Promise.reject(new Error('original error'));
            const result = await fromPromise(promise, (e) => `mapped: ${(e as Error).message}`);
            expect(result).toEqual(err('mapped: original error'));
        });

        it('wendet errorMapper auf undefined an', async () => {
            const promise = Promise.reject(undefined);
            const result = await fromPromise(promise, (e) => `mapped: ${String(e)}`);
            expect(result).toEqual(err('mapped: undefined'));
        });

        it('wendet errorMapper auf null an', async () => {
            const promise = Promise.reject(null);
            const result = await fromPromise(promise, (e) => `mapped: ${String(e)}`);
            expect(result).toEqual(err('mapped: null'));
        });

        it('wendet errorMapper auf komplexe Objekte an', async () => {
            const error = { code: 404, message: 'Not Found' };
            const promise = Promise.reject(error);
            const result = await fromPromise(promise, (e) => `HTTP ${(e as any).code}: ${(e as any).message}`);
            expect(result).toEqual(err('HTTP 404: Not Found'));
        });

        it('errorMapper kann selbst Errors werfen', async () => {
            const promise = Promise.reject('original error');
            const result = await fromPromise(promise, () => {
                throw new Error('mapper error');
            });
            expect(result).toEqual(err(new Error('mapper error')));
        });
    });

    describe('TypeScript Generics', () => {
        it('funktioniert mit expliziten Typ-Parametern', async () => {
            const promise: Promise<string> = Promise.resolve('hello');
            const result = await fromPromise<string, Error>(promise);
            expect(result).toEqual(ok('hello'));
        });

        it('inferiert Typen korrekt', async () => {
            const promise = Promise.resolve(42);
            const result = await fromPromise(promise);
            // TypeScript sollte result als Result<number, unknown> inferieren
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const value: number = result.value;
                expect(value).toBe(42);
            }
        });
    });

    describe('Edge Cases', () => {
        it('handhabt bereits resolvte Promises korrekt', async () => {
            const resolvedPromise = Promise.resolve('already resolved');
            // Mehrfach await sollte funktionieren
            const result1 = await fromPromise(resolvedPromise);
            const result2 = await fromPromise(resolvedPromise);
            expect(result1).toEqual(ok('already resolved'));
            expect(result2).toEqual(ok('already resolved'));
        });

        it('handhabt bereits rejectete Promises korrekt', async () => {
            const rejectedPromise = Promise.reject('already rejected');
            const result1 = await fromPromise(rejectedPromise);
            const result2 = await fromPromise(rejectedPromise);
            expect(result1).toEqual(err('already rejected'));
            expect(result2).toEqual(err('already rejected'));
        });
    });
});