import { describe, expect, it } from 'vitest';

import { Result, ok, err, okIf, okIfLazy, collectFirstOk } from './result';
import {
    ERR_EXPECT_ERR,
    ERR_EXPECT_OK,
    ERR_UNWRAP_ERR_ON_OK,
    ERR_UNWRAP_ON_ERR,
    ExpectErrError,
    ExpectOkError,
    InvalidResultStateError,
    UnwrapErrOnOkError,
    UnwrapOnErrError,
} from '../errors';

describe('Result class', () => {
    describe('static constructors', () => {
        describe('ok', () => {
            it('creates Ok Result with value', () => {
                const result = ok(42);
                expect(result.isOk()).toBe(true);
                expect(result.isErr()).toBe(false);
                expect('error' in result).toBe(false);
                if (result.isOk()) {
                    expect(result.value).toBe(42);
                }
            });
        });

        describe('err', () => {
            it('creates Err Result with error', () => {
                const result = Result.err<string>('error message');
                expect(result.isOk()).toBe(false);
                expect(result.isErr()).toBe(true);
                expect('value' in result).toBe(false);
                if (result.isErr()) {
                    expect(result.error).toBe('error message');
                }
            });
        });

        describe('namespace helpers', () => {
            it('checks Result values with Result.is', () => {
                expect(Result.is(ok(1))).toBe(true);
                expect(Result.is(err('boom'))).toBe(true);
                expect(Result.is({ _tag: 'Ok', value: 1, isOk: () => true, isErr: () => false })).toBe(false);
            });

            it('wraps throwing functions with Result.fromThrowable', () => {
                const parseNumber = Result.fromThrowable((input: string) => {
                    const parsed = JSON.parse(input);
                    if (typeof parsed !== 'number') throw new Error('not a number');
                    return parsed as number;
                }, error => `parse failed: ${(error as Error).message}`);

                expect(parseNumber('42')).toEqual(ok(42));
                expect(parseNumber('"nope"')).toEqual(err('parse failed: not a number'));
            });

            it('preserves thrown values when Result.fromThrowable has no mapper', () => {
                const original = new Error('boom');
                const fail = Result.fromThrowable(() => {
                    throw original;
                });

                expect(fail()).toEqual(err(original));
            });

            it('catches async functions with Result.tryAsync', async () => {
                await expect(Result.tryAsync(async () => 42)).resolves.toEqual(ok(42));
                await expect(Result.tryAsync(
                    async () => {
                        throw new Error('boom');
                    },
                    error => `mapped: ${(error as Error).message}`
                )).resolves.toEqual(err('mapped: boom'));
            });

            it('preserves rejected values when Result.tryAsync has no mapper', async () => {
                const original = new Error('boom');

                await expect(Result.tryAsync(async () => {
                    throw original;
                })).resolves.toEqual(err(original));
            });

            it('exposes collection combinators on the Result namespace', () => {
                expect(Result.sequence([ok(1), ok('a')] as const)).toEqual(ok([1, 'a']));
                expect(Result.all([ok(1), ok('a')] as const)).toEqual(ok([1, 'a']));
                expect(Result.combine(err('left'), err('right'))).toEqual(err(['left', 'right']));
            });

            it('constructs conditional Results with eager and lazy values', () => {
                expect(okIf(true, 1, 'boom')).toEqual(ok(1));
                expect(okIf(false, 1, 'boom')).toEqual(err('boom'));

                expect(okIfLazy(true, () => 2, () => 'lazy boom')).toEqual(ok(2));
                expect(okIfLazy(false, () => 2, () => 'lazy boom')).toEqual(err('lazy boom'));
            });

            it('does not evaluate the unused lazy conditional branch', () => {
                expect(okIfLazy(true, () => 1, () => {
                    throw new Error('unexpected err branch');
                })).toEqual(ok(1));

                expect(okIfLazy(false, () => {
                    throw new Error('unexpected ok branch');
                }, () => 'boom')).toEqual(err('boom'));
            });
        });
    });

    describe('instance methods', () => {
        describe('isOk', () => {
            it('returns true for Ok', () => {
                expect(ok(42).isOk()).toBe(true);
            });

            it('returns false for Err', () => {
                expect(Result.err<string>('error').isOk()).toBe(false);
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).isOk.call(malformed)).toThrow(InvalidResultStateError);
            });
        });

        describe('isErr', () => {
            it('returns false for Ok', () => {
                expect(ok(42).isErr()).toBe(false);
            });

            it('returns true for Err', () => {
                expect(Result.err<string>('error').isErr()).toBe(true);
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).isErr.call(malformed)).toThrow(InvalidResultStateError);
            });
        });

        describe('unwrapOr', () => {
            it('returns value for Ok', () => {
                expect(ok(42).unwrapOr(0)).toBe(42);
            });

            it('returns default for Err', () => {
                expect(Result.err<string, number>('error').unwrapOr(99)).toBe(99);
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).unwrapOr.call(malformed, 99)).toThrow(InvalidResultStateError);
            });
        });

        describe('documented unwrap utilities', () => {
            it('unwrap returns Ok value and throws typed error on Err', () => {
                expect(ok<number, string>(42).unwrap()).toBe(42);

                let caughtError: unknown;
                try {
                    Result.err<string, number>('error').unwrap();
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeInstanceOf(UnwrapOnErrError);
                expect((caughtError as UnwrapOnErrError).code).toBe(ERR_UNWRAP_ON_ERR);
                expect((caughtError as UnwrapOnErrError).errorValue).toBe('error');
            });

            it('unwrapErr returns Err value and throws typed error on Ok', () => {
                expect(Result.err<string, number>('error').unwrapErr()).toBe('error');

                let caughtError: unknown;
                try {
                    ok<number, string>(42).unwrapErr();
                } catch (error) {
                    caughtError = error;
                }

                expect(caughtError).toBeInstanceOf(UnwrapErrOnOkError);
                expect((caughtError as UnwrapErrOnOkError).code).toBe(ERR_UNWRAP_ERR_ON_OK);
                expect((caughtError as UnwrapErrOnOkError).okValue).toBe(42);
            });

            it('unwrapOrElse lazily computes fallback from Err', () => {
                expect(ok<number, string>(42).unwrapOrElse(() => 0)).toBe(42);
                expect(Result.err<string, number>('error').unwrapOrElse((error) => error.length)).toBe(5);
            });

            it('unwrapOrThrow throws the original Err value', () => {
                const original = new Error('boom');

                expect(ok<number, Error>(42).unwrapOrThrow()).toBe(42);
                expect(() => Result.err<Error, number>(original).unwrapOrThrow()).toThrow(original);
            });

            it('expect and expectErr throw typed errors with custom messages', () => {
                expect(ok<number, string>(42).expect('must be ok')).toBe(42);
                expect(Result.err<string, number>('error').expectErr('must be err')).toBe('error');

                let expectOkError: unknown;
                try {
                    Result.err<string, number>('error').expect('must be ok');
                } catch (error) {
                    expectOkError = error;
                }

                expect(expectOkError).toBeInstanceOf(ExpectOkError);
                expect((expectOkError as ExpectOkError).code).toBe(ERR_EXPECT_OK);
                expect((expectOkError as ExpectOkError).expectedMessage).toBe('must be ok');
                expect((expectOkError as ExpectOkError).errorValue).toBe('error');
                expect((expectOkError as ExpectOkError).cause).toBe('error');

                let expectErrError: unknown;
                try {
                    ok<number, string>(42).expectErr('must be err');
                } catch (error) {
                    expectErrError = error;
                }

                expect(expectErrError).toBeInstanceOf(ExpectErrError);
                expect((expectErrError as ExpectErrError).code).toBe(ERR_EXPECT_ERR);
                expect((expectErrError as ExpectErrError).expectedMessage).toBe('must be err');
                expect((expectErrError as ExpectErrError).okValue).toBe(42);
                expect((expectErrError as ExpectErrError).cause).toBe(42);
            });

            it('expect throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).expect.call(malformed, 'must be ok')).toThrow(InvalidResultStateError);
            });

            it('expectErr throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).expectErr.call(malformed, 'must be err')).toThrow(InvalidResultStateError);
            });

            it('unwrap utilities throw for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;
                const source = ok<number, string>(0);

                expect(() => source.unwrap.call(malformed)).toThrow(InvalidResultStateError);
                expect(() => source.unwrapErr.call(malformed)).toThrow(InvalidResultStateError);
                expect(() => source.unwrapOrElse.call(malformed, () => 1)).toThrow(InvalidResultStateError);
                expect(() => source.unwrapOrThrow.call(malformed)).toThrow(InvalidResultStateError);
            });
        });

        describe('documented conversions', () => {
            it('toPromise resolves Ok and rejects Err', async () => {
                await expect(ok<number, string>(42).toPromise()).resolves.toBe(42);
                await expect(Result.err<string, number>('boom').toPromise()).rejects.toBe('boom');
            });

            it('toNullable returns Ok value or null', () => {
                expect(ok<number, string>(42).toNullable()).toBe(42);
                expect(Result.err<string, number>('boom').toNullable()).toBeNull();
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;
                const source = ok<number, string>(0);

                expect(() => source.toPromise.call(malformed)).toThrow(InvalidResultStateError);
                expect(() => source.toNullable.call(malformed)).toThrow(InvalidResultStateError);
            });
        });

        describe('fold', () => {
            it('calls onOk for Ok and returns result', () => {
                const result = ok(2).fold(
                    (value) => value * 2,
                    () => -1
                );

                expect(result).toBe(4);
            });

            it('calls onErr for Err and returns result', () => {
                const result = err('boom').fold(
                    () => 'ok',
                    (error) => `err:${error}`
                );

                expect(result).toBe('err:boom');
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

                expect(() => ok<number, string>(0).fold.call(malformed, value => value, error => error.length)).toThrow(InvalidResultStateError);
            });
        });

        describe('matchError', () => {
            it('keeps deprecated match() guarded on Ok state', () => {
                expect(() => ok<number, string>(0).match()).toThrow('match() can only be called on Err results');
            });

            it('throws for malformed Result state', () => {
                const malformed = { _tag: 'Invalid' } as unknown as Result<number, string>;
                const source = ok<number, string>(0);

                expect(() => source.matchError.call(malformed)).toThrow(InvalidResultStateError);
                expect(() => source.matchErrorAsync.call(malformed)).toThrow(InvalidResultStateError);
            });
        });
    });

    describe('Result behavior', () => {
        it('Ok and Err are different instances', () => {
            const okResult = ok(42);
            const errResult = err('error');

            expect(okResult).not.toBe(errResult);
            expect(okResult.serialize()).not.toEqual(errResult.serialize());
        });

        it('equal values create equal Results', () => {
            const result1 = ok(42);
            const result2 = ok(42);

            expect(result1).not.toBe(result2); // Different instances
            expect(result1.serialize()).toEqual(result2.serialize());
        });

        it('Type Guards work correctly', () => {
            const okResult = ok(42);
            const errResult = err('error');

            if (okResult.isOk()) {
                // TypeScript knows it is Ok<T>
                expect(okResult.value).toBe(42);
            }

            if (errResult.isErr()) {
                // TypeScript knows it is Err<E>
                expect(errResult.error).toBe('error');
            }
        });

        it('Result is immutable', () => {
            const result = ok(42);
            expect(Object.isFrozen(result)).toBe(true);
            expect(Object.isExtensible(result)).toBe(false);
            expect(() => Object.defineProperty(result as any, 'x', { value: 1 })).toThrow(TypeError);
        });
    });

    describe('Result types', () => {
        it('Ok Result has correct typing', () => {
            const result: Result<number, string> = ok(42);

            expect(result.isOk()).toBe(true);
            expect(result.isErr()).toBe(false);

            if (result.isOk()) {
                const value: number = result.value;
                expect(value).toBe(42);
            }
        });

        it('Err Result has correct typing', () => {
            const result: Result<number, string> = err('error');

            expect(result.isOk()).toBe(false);
            expect(result.isErr()).toBe(true);

            if (result.isErr()) {
                const error: string = result.error;
                expect(error).toBe('error');
            }
        });
    });

    describe('pipeAsync filterAsync coverage', () => {
        it('filterAsync returns source when predicate is true', async () => {
            const result = ok(42);
            const filtered = await result.pipeAsync(async (r) => {
                if (r.isOk() && r.value > 40) {
                    return r;
                }
                return err('too small');
            });
            expect(filtered.isOk()).toBe(true);
            if (filtered.isOk()) {
                expect(filtered.value).toBe(42);
            }
        });

        it('filterAsync returns err when predicate is false', async () => {
            const result = ok(30);
            const filtered = await result.pipeAsync(async (r) => {
                if (r.isOk() && r.value > 40) {
                    return r;
                }
                return err('too small');
            });
            expect(filtered.isErr()).toBe(true);
            if (filtered.isErr()) {
                expect(filtered.error).toBe('too small');
            }
        });

        it('filterAsync passes through err results', async () => {
            const result = err('original error');
            const filtered = await result.pipeAsync(async (r) => r); // identity function
            expect(filtered.isErr()).toBe(true);
            if (filtered.isErr()) {
                expect(filtered.error).toBe('original error');
            }
        });
    });

    describe('collectFirstOk coverage', () => {
        it('returns first Ok result', () => {
            const results = [err('error1'), err('error2'), ok(42), err('error3')];
            const collected = collectFirstOk(results);
            expect(collected.isOk()).toBe(true);
            if (collected.isOk()) {
                expect(collected.value).toBe(42);
            }
        });

        it('returns all errors when no Ok found', () => {
            const results = [err('error1'), err('error2'), err('error3')];
            const collected = collectFirstOk(results);
            expect(collected.isErr()).toBe(true);
            if (collected.isErr()) {
                expect(collected.error).toEqual(['error1', 'error2', 'error3']);
            }
        });

        it('returns empty error array for no results', () => {
            const results: Result<number, string>[] = [];
            const collected = collectFirstOk(results);
            expect(collected.isErr()).toBe(true);
            if (collected.isErr()) {
                expect(collected.error).toEqual([]);
            }
        });
    });

    describe('pipe operators edge cases coverage', () => {
        describe('mapErr passes through Ok results', () => {
            it('returns source unchanged when result is Ok', () => {
                const result = ok(42);
                const mapped = result.pipe((r) => {
                    if (r.isErr()) {
                        return ok('fallback');
                    }
                    return r; // This line should be covered
                });
                expect(mapped).toBe(result);
            });
        });

        describe('filter passes through Err results', () => {
            it('returns source unchanged when result is Err', () => {
                const result = err('original error');
                const filtered = result.pipe((r) => {
                    if (r.isOk() && r.value > 10) {
                        return r;
                    }
                    return r; // This should be the Err result
                });
                expect(filtered).toBe(result);
            });
        });

        describe('mapAsync passes through Err results', () => {
            it('returns source unchanged when result is Err', async () => {
                const result = err('original error');
                const mapped = await result.pipeAsync(async (r) => {
                    if (r.isOk()) {
                        return ok(r.value * 2);
                    }
                    return r; // This line should be covered
                });
                expect(mapped).toBe(result);
            });
        });

        describe('filterAsync passes through Err results', () => {
            it('returns source unchanged when result is Err', async () => {
                const result = err('original error');
                const filtered = await result.pipeAsync(async (r) => r); // identity
                expect(filtered).toBe(result);
            });

            it('returns Err from errorFn when result is Ok but predicate fails', async () => {
                const result = ok(5); // Small number that fails predicate
                const filtered = await result.pipeAsync(async (r) => {
                    if (r.isOk() && r.value > 10) {
                        return r;
                    }
                    return err('too small'); // This should be returned
                });
                expect(filtered.isErr()).toBe(true);
                if (filtered.isErr()) {
                    expect(filtered.error).toBe('too small');
                }
            });
        });
    });

    describe('serialize', () => {
        it('serializes Ok Result to object format', () => {
            const result = ok(42);
            expect(result.serialize()).toEqual({ isSuccess: true, data: 42 });
        });

        it('serializes Err Result and preserves original error types', () => {
            const result = err('error message');
            expect(result.serialize()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('preserves Error objects as original objects', () => {
            const error = new Error('error message');
            const result = err(error);
            const serialized = result.serialize();
            expect(serialized.isSuccess).toBe(false);
            expect(serialized.error).toBe(error); // Ursprüngliches Error-Objekt
        });

        it('preserves any error types', () => {
            const result = err(404);
            expect(result.serialize()).toEqual({ isSuccess: false, error: 404 });
        });

        it('throws for malformed Result state', () => {
            const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

            expect(() => ok<number, string>(0).serialize.call(malformed)).toThrow(InvalidResultStateError);
        });
    });

    describe('toUserFriendly', () => {
        it('serializes Ok Result to user-friendly format', () => {
            const result = ok(42);
            expect(result.toUserFriendly()).toEqual({ isSuccess: true, data: 42 });
        });

        it('converts string errors to user-friendly format', () => {
            const result = err('error message');
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('extracts message from Error objects for user-friendly format', () => {
            const error = new Error('error message');
            const result = err(error);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('converts non-string message properties to strings', () => {
            const result = err({ message: 404 });
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: '404' });
        });

        it('converts any error types to strings for user-friendly format', () => {
            const result = err(404);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: '404' });
        });

        it('throws for malformed Result state', () => {
            const malformed = { _tag: 'Invalid', value: undefined, error: undefined } as unknown as Result<number, string>;

            expect(() => ok<number, string>(0).toUserFriendly.call(malformed)).toThrow(InvalidResultStateError);
        });

        it('is perfect for APIs and user interfaces', () => {
            const result = ok({ user: 'alice', balance: 100 });
            const userFriendly = result.toUserFriendly();
            expect(userFriendly).toEqual({
                isSuccess: true,
                data: { user: 'alice', balance: 100 }
            });
        });
    });
});
