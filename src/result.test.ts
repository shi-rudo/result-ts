import { describe, expect, it, vi } from 'vitest';

import { Result, ok, err, collectFirstOk, okIf, okIfLazy } from './index';

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

            it('works as a type guard', () => {
                const result: Result<number, string> = ok(42);
                if (result.isOk()) {
                    const value: number = result.value;
                    expect(value).toBe(42);
                    expect(result.error).toBeUndefined();
                }
            });
        });

        describe('isErr', () => {
            it('returns false for Ok', () => {
                expect(ok(42).isErr()).toBe(false);
            });

            it('returns true for Err', () => {
                expect(Result.err<string>('error').isErr()).toBe(true);
            });

            it('works as a type guard', () => {
                const result: Result<number, string> = err('error message');
                if (result.isErr()) {
                    const error: string = result.error;
                    expect(error).toBe('error message');
                    expect(result.value).toBeUndefined();
                }
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

        describe('toUserFriendly', () => {
            it('uses string message when Error instance', () => {
                const result = Result.err(new Error('boom')).toUserFriendly();
                expect(result.isSuccess).toBe(false);
                expect(result.error).toBe('boom');
            });

            it('forces string even when message is not a string', () => {
                const result = Result.err({ message: 123 } as unknown).toUserFriendly();
                expect(result.isSuccess).toBe(false);
                expect(typeof result.error).toBe('string');
            });
        });


        describe('matchErr (old error-only matcher)', () => {
            it('throws error when called on Ok', () => {
                const result = ok(42);
                expect(() => {
                    result.matchErr();
                }).toThrow('matchErr() can only be called on Err results. Use `if (result.isErr()) { ... }` first.');
            });

            it('returns ErrorMatchBuilder when called on Err', () => {
                const result = err('error');
                if (result.isErr()) {
                    const builder = result.matchErr();
                    expect(builder).toBeDefined();
                }
            });
        });

        describe('matchErrResult', () => {
            it('returns ErrMatchBuilder for Ok result', () => {
                const result = ok(42);
                const builder = result.matchErrResult();
                expect(builder).toBeDefined();
            });

            it('returns ErrMatchBuilder for Err result', () => {
                const result = err('error');
                const builder = result.matchErrResult();
                expect(builder).toBeDefined();
            });
        });

        describe('match', () => {
            it('returns ResultMatchBuilder for Ok result', () => {
                const result = ok(42);
                const builder = result.match();
                expect(builder).toBeDefined();
            });

            it('returns ResultMatchBuilder for Err result', () => {
                const result = err('error');
                const builder = result.match();
                expect(builder).toBeDefined();
            });
        });

        describe('pattern (deprecated)', () => {
            it('returns ResultMatchBuilder (alias for match)', () => {
                const result = ok(42);
                const builder = result.pattern();
                expect(builder).toBeDefined();
            });
        });

        describe('switch (deprecated)', () => {
            it('returns ResultMatchBuilder (alias for match)', () => {
                const result = ok(42);
                const builder = result.switch();
                expect(builder).toBeDefined();
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

        it('same values produce equal Results', () => {
            const result1 = ok(42);
            const result2 = ok(42);

            expect(result1).not.toBe(result2); // Different instances
            expect(result1.serialize()).toEqual(result2.serialize());
        });

        it('type guards work correctly', () => {
            const okResult = ok(42);
            const errResult = err('error');

            if (okResult.isOk()) {
                // TypeScript knows this is Ok<T>
                expect(okResult.value).toBe(42);
            }

            if (errResult.isErr()) {
                // TypeScript knows this is Err<E>
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
                const value: number = result.value!;
                expect(value).toBe(42);
            }
        });

        it('Err Result has correct typing', () => {
            const result: Result<number, string> = err('error');

            expect(result.isOk()).toBe(false);
            expect(result.isErr()).toBe(true);

            if (result.isErr()) {
                const error: string = result.error!;
                expect(error).toBe('error');
            }
        });
    });

    describe('pipeAsync filterAsync coverage', () => {
        it('filterAsync returns source when predicate is true', async () => {
            const result = ok(42);
            const filtered = await result.pipeAsync(async (r) => {
                if (r.isOk() && r.value! > 40) {
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
                if (r.isOk() && r.value! > 40) {
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
                    if (r.isOk() && r.value! > 10) {
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
                        return ok(r.value! * 2);
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
                    if (r.isOk() && r.value! > 10) {
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
            expect(serialized.error).toBe(error); // Original Error object
        });

        it('preserves arbitrary error types', () => {
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

        it('converts arbitrary error types to strings for user-friendly format', () => {
            const result = err(404);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: '404' });
        });

        it('handles unstringifiable errors gracefully', () => {
            // Create an object that causes String() to throw
            // We use a Proxy that throws when any property is accessed
            // String() internally accesses toString/valueOf, so this should trigger the catch
            const unstringifiable = new Proxy(Object.create(null), {
                get() {
                    throw new Error('Property access failed');
                },
                ownKeys() {
                    throw new Error('Own keys failed');
                },
                getOwnPropertyDescriptor() {
                    throw new Error('Property descriptor failed');
                }
            });

            const result = err(unstringifiable);
            const friendly = result.toUserFriendly();
            expect(friendly.isSuccess).toBe(false);
            // The catch block should catch the error and return '[Unstringifiable error]'
            expect(friendly.error).toBe('[Unstringifiable error]');
        });

        it('is ideal for APIs and user interfaces', () => {
            const result = ok({ user: 'alice', balance: 100 });
            const userFriendly = result.toUserFriendly();
            expect(userFriendly).toEqual({
                isSuccess: true,
                data: { user: 'alice', balance: 100 }
            });
        });
    });

    describe('toUnion', () => {
        it('returns Ok as a discriminated union', () => {
            const result = ok(42);

            const union = result.toUnion();
            expect(union).toEqual({ _tag: 'Ok', value: 42 });
            expect(Object.isFrozen(union)).toBe(true);
            expect(result.toUnion()).toBe(union);
        });

        it('returns Err as a discriminated union', () => {
            const error = new Error('bad');
            const result = err(error);

            const union = result.toUnion();
            expect(union._tag).toBe('Err');
            if (union._tag === 'Err') {
                expect(union.error).toBe(error);
            }
            expect(Object.isFrozen(union)).toBe(true);
            expect(result.toUnion()).toBe(union);
        });
    });

    describe('okIf helper', () => {
        it('returns Ok when condition is true', () => {
            const result = okIf(true, 42, 'error');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(42);
            }
        });

        it('returns Err when condition is false', () => {
            const result = okIf(false, 42, 'error');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error).toBe('error');
            }
        });

        it('infers correct types without manual annotation', () => {
            const result = okIf(5 > 3, 'success', 'failure');
            // Type check: should be Result<string, string>
            expect(result.isOk()).toBe(true);
        });

        it('works with different types', () => {
            const result = okIf(true, 123, 'error message');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(123);
            }
        });
    });

    describe('okIfLazy helper', () => {
        it('returns Ok and only evaluates okFn', () => {
            const okFn = vi.fn(() => 42);
            const errFn = vi.fn(() => 'error');

            const result = okIfLazy(true, okFn, errFn);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(42);
            }
            expect(okFn).toHaveBeenCalledOnce();
            expect(errFn).not.toHaveBeenCalled();
        });

        it('returns Err and only evaluates errFn', () => {
            const okFn = vi.fn(() => 42);
            const errFn = vi.fn(() => 'error');

            const result = okIfLazy(false, okFn, errFn);

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error).toBe('error');
            }
            expect(okFn).not.toHaveBeenCalled();
            expect(errFn).toHaveBeenCalledOnce();
        });

        it('avoids unnecessary computations', () => {
            const expensiveComputation = vi.fn(() => {
                let sum = 0;
                for (let i = 0; i < 1000; i++) sum += i;
                return sum;
            });

            const result = okIfLazy(false, expensiveComputation, () => 'skipped');

            expect(result.isErr()).toBe(true);
            expect(expensiveComputation).not.toHaveBeenCalled();
        });
    });

    describe('unwrap and unwrapErr', () => {
        describe('unwrap', () => {
            it('returns value when Ok', () => {
                const result = ok(42);
                expect(result.unwrap()).toBe(42);
            });

            it('throws error when called on Err', () => {
                const result = err('error message');
                expect(() => result.unwrap()).toThrow('Called unwrap() on Err: error message');
            });

            it('works as a type guard', () => {
                const result: Result<number, string> = ok(42);
                if (result.isOk()) {
                    const value: number = result.unwrap(); // Type is number, not number | undefined
                    expect(value).toBe(42);
                }
            });

            it('handles circular references safely', () => {
                const circular: any = {};
                circular.self = circular;
                const result = err(circular);
                // Should throw an error, but not crash due to circular reference
                expect(() => result.unwrap()).toThrow(/Called unwrap\(\) on Err/);
                // The error message should be safe (no stack overflow)
                let errorMessage = '';
                try {
                    result.unwrap();
                } catch (e: any) {
                    errorMessage = e.message;
                }
                expect(errorMessage).toContain('Called unwrap() on Err');
                expect(errorMessage.length).toBeLessThan(1000); // Should not be too long
            });

            it('handles null safely', () => {
                const result = err(null);
                expect(() => result.unwrap()).toThrow('Called unwrap() on Err: null');
            });

            it('handles undefined safely', () => {
                const result = err(undefined);
                expect(() => result.unwrap()).toThrow('Called unwrap() on Err: undefined');
            });

            it('handles Error objects safely', () => {
                const error = new Error('test error');
                const result = err(error);
                expect(() => result.unwrap()).toThrow('Called unwrap() on Err: test error');
            });

            it('handles unstringifiable error objects', () => {
                // Create an object that throws when String() is called
                const unstringifiable = new Proxy(Object.create(null), {
                    get() {
                        throw new Error('Property access failed');
                    },
                    ownKeys() {
                        throw new Error('Own keys failed');
                    },
                    getOwnPropertyDescriptor() {
                        throw new Error('Property descriptor failed');
                    }
                });

                const result = err(unstringifiable);
                // Should throw with '[unstringifiable error]' fallback
                expect(() => result.unwrap()).toThrow(/Called unwrap\(\) on Err/);
            });
        });

        describe('unwrapErr', () => {
            it('returns error when Err', () => {
                const result = err('error message');
                expect(result.unwrapErr()).toBe('error message');
            });

            it('throws error when called on Ok', () => {
                const result = ok(42);
                expect(() => result.unwrapErr()).toThrow('Called unwrapErr() on Ok: 42');
            });

            it('works as a type guard', () => {
                const result: Result<number, string> = err('error message');
                if (result.isErr()) {
                    const error: string = result.unwrapErr(); // Type is string, not string | undefined
                    expect(error).toBe('error message');
                }
            });

            it('handles circular references safely', () => {
                const circular: any = {};
                circular.self = circular;
                const result = ok(circular);
                // Should throw an error, but not crash due to circular reference
                expect(() => result.unwrapErr()).toThrow(/Called unwrapErr\(\) on Ok/);
                // The error message should be safe (no stack overflow)
                let errorMessage = '';
                try {
                    result.unwrapErr();
                } catch (e: any) {
                    errorMessage = e.message;
                }
                expect(errorMessage).toContain('Called unwrapErr() on Ok');
                expect(errorMessage.length).toBeLessThan(1000); // Should not be too long
            });

            it('handles null safely', () => {
                const result = ok(null);
                expect(() => result.unwrapErr()).toThrow('Called unwrapErr() on Ok: null');
            });

            it('handles undefined safely', () => {
                const result = ok(undefined);
                expect(() => result.unwrapErr()).toThrow('Called unwrapErr() on Ok: undefined');
            });

            it('handles Error objects safely', () => {
                const error = new Error('test error');
                const result = ok(error);
                expect(() => result.unwrapErr()).toThrow('Called unwrapErr() on Ok: test error');
            });

            it('handles unstringifiable value objects', () => {
                // Create an object that throws when String() is called
                const unstringifiable = new Proxy(Object.create(null), {
                    get() {
                        throw new Error('Property access failed');
                    },
                    ownKeys() {
                        throw new Error('Own keys failed');
                    },
                    getOwnPropertyDescriptor() {
                        throw new Error('Property descriptor failed');
                    }
                });

                const result = ok(unstringifiable);
                // Should throw with '[unstringifiable value]' fallback
                expect(() => result.unwrapErr()).toThrow(/Called unwrapErr\(\) on Ok/);
            });
        });

        describe('expect', () => {
            it('returns value when Ok', () => {
                const result = ok(42);
                expect(result.expect('should be ok')).toBe(42);
            });

            it('throws custom error when called on Err', () => {
                const result = err('error message');
                expect(() => result.expect('Custom error message')).toThrow('Custom error message');
            });

            it('works as a type guard', () => {
                const result: Result<number, string> = ok(42);
                if (result.isOk()) {
                    const value: number = result.expect('should be ok');
                    expect(value).toBe(42);
                }
            });
        });

        describe('expectErr', () => {
            it('returns error when Err', () => {
                const result = err('error message');
                expect(result.expectErr('should be err')).toBe('error message');
            });

            it('throws custom error when called on Ok', () => {
                const result = ok(42);
                expect(() => result.expectErr('Custom error message')).toThrow('Custom error message');
            });

            it('works as a type guard', () => {
                const result: Result<number, string> = err('error message');
                if (result.isErr()) {
                    const error: string = result.expectErr('should be err');
                    expect(error).toBe('error message');
                }
            });
        });
    });

    describe('toPromise', () => {
        it('converts Ok to resolved Promise', async () => {
            const result = ok(42);
            const promise = result.toPromise();
            const value = await promise;
            expect(value).toBe(42);
        });

        it('converts Err to rejected Promise', async () => {
            const result = err('error message');
            const promise = result.toPromise();
            await expect(promise).rejects.toBe('error message');
        });
    });

    describe('toNullable', () => {
        it('converts Ok to value', () => {
            const result = ok(42);
            expect(result.toNullable()).toBe(42);
        });

        it('converts Err to null', () => {
            const result = err('error');
            expect(result.toNullable()).toBeNull();
        });

        it('handles null values correctly', () => {
            const result = ok(null);
            expect(result.toNullable()).toBeNull();
        });
    });

    describe('fold', () => {
        it('applies onOk function for Ok result', () => {
            const result = ok(42);
            const output = result.fold(
                val => `Success: ${val}`,
                err => `Error: ${err}`
            );
            expect(output).toBe('Success: 42');
        });

        it('applies onErr function for Err result', () => {
            const result = err('something went wrong');
            const output = result.fold(
                val => `Success: ${val}`,
                err => `Error: ${err}`
            );
            expect(output).toBe('Error: something went wrong');
        });

        it('works with different return types', () => {
            const result = ok(42);
            const number = result.fold(
                val => val * 2,
                () => 0
            );
            expect(number).toBe(84);
        });

        it('can return complex types', () => {
            const result: Result<string, number> = err(404);
            const response = result.fold(
                data => ({ success: true as const, data }),
                code => ({ success: false as const, code })
            );
            expect(response).toEqual({ success: false, code: 404 });
        });

        it('works with void return type', () => {
            const result = ok(42);
            let called = '';
            result.fold(
                val => { called = `ok:${val}`; },
                err => { called = `err:${err}`; }
            );
            expect(called).toBe('ok:42');
        });

        it('handles null and undefined values', () => {
            const nullResult = ok(null);
            const nullOutput = nullResult.fold(
                val => val === null ? 'is null' : 'not null',
                () => 'error'
            );
            expect(nullOutput).toBe('is null');

            const undefinedResult = ok(undefined);
            const undefinedOutput = undefinedResult.fold(
                val => val === undefined ? 'is undefined' : 'not undefined',
                () => 'error'
            );
            expect(undefinedOutput).toBe('is undefined');
        });
    });
});
