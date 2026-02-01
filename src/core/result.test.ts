import { describe, expect, it } from 'vitest';

import { Result, ok, err, collectFirstOk } from './result';

describe('Result class', () => {
    describe('static constructors', () => {
        describe('ok', () => {
            it('creates Ok Result with value', () => {
                const result = ok(42);
                expect(result.isOk()).toBe(true);
                expect(result.isErr()).toBe(false);
                if (result.isOk()) {
                    expect(result.value).toBe(42);
                    expect(result.error).toBeUndefined();
                }
            });
        });

        describe('err', () => {
            it('creates Err Result with error', () => {
                const result = Result.err<string>('error message');
                expect(result.isOk()).toBe(false);
                expect(result.isErr()).toBe(true);
                if (result.isErr()) {
                    expect(result.error).toBe('error message');
                    expect(result.value).toBeUndefined();
                }
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
        });

        describe('isErr', () => {
            it('returns false for Ok', () => {
                expect(ok(42).isErr()).toBe(false);
            });

            it('returns true for Err', () => {
                expect(Result.err<string>('error').isErr()).toBe(true);
            });
        });

        describe('unwrapOr', () => {
            it('returns value for Ok', () => {
                expect(ok(42).unwrapOr(0)).toBe(42);
            });

            it('returns default for Err', () => {
                expect(Result.err<string, number>('error').unwrapOr(99)).toBe(99);
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

        it('converts any error types to strings for user-friendly format', () => {
            const result = err(404);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: '404' });
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
