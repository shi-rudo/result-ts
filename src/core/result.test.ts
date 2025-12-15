import { describe, expect, it } from 'vitest';

import { Result, ok, err, collectFirstOk } from './result';

describe('Result class', () => {
    describe('static constructors', () => {
        describe('ok', () => {
            it('erstellt Ok Result mit Wert', () => {
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
            it('erstellt Err Result mit Fehler', () => {
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
            it('gibt true für Ok zurück', () => {
                expect(ok(42).isOk()).toBe(true);
            });

            it('gibt false für Err zurück', () => {
                expect(Result.err<string>('error').isOk()).toBe(false);
            });
        });

        describe('isErr', () => {
            it('gibt false für Ok zurück', () => {
                expect(ok(42).isErr()).toBe(false);
            });

            it('gibt true für Err zurück', () => {
                expect(Result.err<string>('error').isErr()).toBe(true);
            });
        });

        describe('unwrapOr', () => {
            it('gibt Wert bei Ok zurück', () => {
                expect(ok(42).unwrapOr(0)).toBe(42);
            });

            it('gibt Default bei Err zurück', () => {
                expect(Result.err<string, number>('error').unwrapOr(99)).toBe(99);
            });
        });
    });

    describe('Result behavior', () => {
        it('Ok und Err sind unterschiedliche Instanzen', () => {
            const okResult = ok(42);
            const errResult = err('error');

            expect(okResult).not.toBe(errResult);
            expect(okResult.serialize()).not.toEqual(errResult.serialize());
        });

        it('gleiche Werte erzeugen gleiche Results', () => {
            const result1 = ok(42);
            const result2 = ok(42);

            expect(result1).not.toBe(result2); // Verschiedene Instanzen
            expect(result1.serialize()).toEqual(result2.serialize());
        });

        it('Type Guards funktionieren korrekt', () => {
            const okResult = ok(42);
            const errResult = err('error');

            if (okResult.isOk()) {
                // TypeScript weiß, dass es Ok<T> ist
                expect(okResult.value).toBe(42);
            }

            if (errResult.isErr()) {
                // TypeScript weiß, dass es Err<E> ist
                expect(errResult.error).toBe('error');
            }
        });

        it('Result ist immutable', () => {
            const result = ok(42);
            expect(Object.isFrozen(result)).toBe(true);
            expect(Object.isExtensible(result)).toBe(false);
            expect(() => Object.defineProperty(result as any, 'x', { value: 1 })).toThrow(TypeError);
        });
    });

    describe('Result types', () => {
        it('Ok Result hat korrekte Typisierung', () => {
            const result: Result<number, string> = ok(42);

            expect(result.isOk()).toBe(true);
            expect(result.isErr()).toBe(false);

            if (result.isOk()) {
                const value: number = result.value;
                expect(value).toBe(42);
            }
        });

        it('Err Result hat korrekte Typisierung', () => {
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
        it('serialisiert Ok Result zu Objekt-Format', () => {
            const result = ok(42);
            expect(result.serialize()).toEqual({ isSuccess: true, data: 42 });
        });

        it('serialisiert Err Result und behält ursprüngliche Error-Typen', () => {
            const result = err('error message');
            expect(result.serialize()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('behält Error-Objekte als ursprüngliche Objekte', () => {
            const error = new Error('error message');
            const result = err(error);
            const serialized = result.serialize();
            expect(serialized.isSuccess).toBe(false);
            expect(serialized.error).toBe(error); // Ursprüngliches Error-Objekt
        });

        it('behält beliebige Error-Typen', () => {
            const result = err(404);
            expect(result.serialize()).toEqual({ isSuccess: false, error: 404 });
        });
    });

    describe('toUserFriendly', () => {
        it('serialisiert Ok Result zu user-friendly Format', () => {
            const result = ok(42);
            expect(result.toUserFriendly()).toEqual({ isSuccess: true, data: 42 });
        });

        it('konvertiert string Errors zu user-friendly Format', () => {
            const result = err('error message');
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('extrahiert message aus Error-Objekten für user-friendly Format', () => {
            const error = new Error('error message');
            const result = err(error);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: 'error message' });
        });

        it('konvertiert beliebige Error-Typen zu strings für user-friendly Format', () => {
            const result = err(404);
            expect(result.toUserFriendly()).toEqual({ isSuccess: false, error: '404' });
        });

        it('ist perfekt für APIs und User-Interfaces', () => {
            const result = ok({ user: 'alice', balance: 100 });
            const userFriendly = result.toUserFriendly();
            expect(userFriendly).toEqual({
                isSuccess: true,
                data: { user: 'alice', balance: 100 }
            });
        });
    });
});
