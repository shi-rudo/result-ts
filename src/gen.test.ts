import { describe, expect, it } from 'vitest';

import type { Result } from './index';
import { err, ok, Result as ResultClass } from './index';
import { task } from './gen';
import {
    ERR_INVALID_STATE,
    ERR_TASK_YIELD_NOT_RESULT,
    InvalidResultStateError,
    TaskYieldNotResultError,
} from './errors';

describe('task/gen (Do-Notation)', () => {
    describe('Basic functionality', () => {
        it('unwraps Ok via yield* and wraps return in Ok', async () => {
            const out = await task(function* () {
                const a = yield* ok(1);
                const b = yield* ok(a + 1);
                return b * 2;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(4);
            }
        });

        it('single yield* works', async () => {
            const out = await task(function* () {
                return yield* ok(42);
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(42);
            }
        });

        it('no yields, just return works', async () => {
            const out = await task(function* () {
                return 42;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(42);
            }
        });

        it('empty generator works', async () => {
            const out = await task(function* () {
                // No yields, no return
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(undefined);
            }
        });
    });

    describe('Error handling and short-circuiting', () => {
        it('short-circuits on first Err and runs finally', async () => {
            let cleaned = false;

            const out = await task(function* () {
                try {
                    const a = yield* ok(1);
                    const _b = yield* err<string, number>('boom');
                    return a;
                } finally {
                    cleaned = true;
                }
            });

            expect(cleaned).toBe(true);
            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toBe('boom');
            }
        });

        it('short-circuits in middle of chain', async () => {
            let executed = false;

            const out = await task(function* () {
                const a = yield* ok(1);
                const b = yield* ok(2);
                const _c = yield* err('fail');
                executed = true; // Should not execute
                const d = yield* ok(4);
                return a + b + d;
            });

            expect(executed).toBe(false);
            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toBe('fail');
            }
        });

        it('multiple finally blocks execute in reverse order', async () => {
            const log: string[] = [];

            const out = await task(function* () {
                try {
                    try {
                        const a = yield* ok(1);
                        const _b = yield* err('fail');
                        return a;
                    } finally {
                        log.push('inner finally');
                    }
                } finally {
                    log.push('outer finally');
                }
            });

            expect(log).toEqual(['inner finally', 'outer finally']);
            expect(out.isErr()).toBe(true);
        });
    });

    describe('Async generators', () => {
        it('also works with async generator', async () => {
            const out = await task(async function* () {
                const a = yield* ok(1);
                await Promise.resolve();
                const b = yield* ok(a + 1);
                return b;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(2);
            }
        });

        it('mixed sync and async operations in generator', async () => {
            const out = await task(async function* () {
                const a = yield* ok(1);
                await new Promise(resolve => setTimeout(resolve, 1));
                const b = yield* ok(a + 1);
                const c = yield* ok(b + 1); // sync
                await Promise.resolve();
                return c;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(3);
            }
        });
    });

    describe('Type inference', () => {
        it('infers error union from yielded Results', async () => {
            type DbError = { readonly _tag: 'DbError' };
            type ValidationError = { readonly _tag: 'ValidationError' };

            const out = await task(async function* () {
                const a = yield* ok<number, DbError>(1);
                const b = yield* ok<string, ValidationError>('x');
                return { a, b } as const;
            });

            const typed: Result<{ readonly a: number; readonly b: string }, DbError | ValidationError> = out;
            expect(typed.isOk()).toBe(true);
        });

        it('handles complex nested types', async () => {
            type ComplexError = { code: number; message: string };

            const out = await task(function* () {
                const data = yield* ok<{ items: number[] }, ComplexError>({ items: [1, 2, 3] });
                return data.items.length;
            });

            const typed: Result<number, ComplexError> = out;
            expect(typed.isOk()).toBe(true);
            if (typed.isOk()) {
                expect(typed.value).toBe(3);
            }
        });
    });

    describe('Result returns and double-wrap prevention', () => {
        it('returns returned Result directly (no double wrap)', async () => {
            const out = await task(function* () {
                return ResultClass.err('boom');
            });
            expect(out.isErr()).toBe(true);
            if (out.isErr()) expect(out.error).toBe('boom');
        });

        it('returned Ok Result is not double-wrapped', async () => {
            const out = await task(function* () {
                return ok(42);
            });
            expect(out.isOk()).toBe(true);
            if (out.isOk()) expect(out.value).toBe(42);
        });

        it('can return complex Result types', async () => {
            type CustomError = { type: 'Custom'; details: string };

            const out = await task(function* () {
                return ResultClass.err<CustomError, number>({ type: 'Custom', details: 'test' });
            });

            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toEqual({ type: 'Custom', details: 'test' });
            }
        });
    });

    describe('Exception handling via onThrow', () => {
        it('can map exceptions to Err via onThrow', async () => {
            type Thrown = { readonly _tag: 'Thrown' };

            const out = await task(
                function* () {
                    throw new Error('boom');
                },
                (_error): Thrown => ({ _tag: 'Thrown' })
            );

            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                const error = out.error as Thrown;
                expect(error._tag).toBe('Thrown');
            }
        });

        it('onThrow can map different error types', async () => {
            const out = await task(
                function* () {
                    throw 'string error';
                },
                (error) => ({ mapped: true, original: error })
            );

            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toEqual({ mapped: true, original: 'string error' });
            }
        });

        it('without onThrow, exceptions are rethrown', async () => {
            await expect(task(function* () {
                yield* ok(1);
                throw new Error('test');
            })).rejects.toThrow('test');
        });
    });

    describe('Advanced patterns', () => {
        it('supports nested generator calls', async () => {
            function* innerGen() {
                const x = yield* ok(10);
                return x * 2;
            }

            const out = await task(function* () {
                const a = yield* ok(1);
                const b = yield* innerGen();
                return a + b;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(21); // 1 + (10 * 2)
            }
        });

        it('handles early returns correctly', async () => {
            let executed = false;

            const out = await task(function* () {
                const a = yield* ok(1);
                if (a > 0) {
                    return 42; // Early return
                }
                executed = true; // Should not execute
                const b = yield* ok(2);
                return a + b;
            });

            expect(executed).toBe(false);
            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(42);
            }
        });

        it('complex error recovery pattern', async () => {
            const out = await task(function* () {
                const a = yield* ok(1);
                const b = yield* err('first error');

                // This should not execute due to short-circuiting
                const c = yield* ok(a + b);
                return c;
            });

            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toBe('first error');
            }
        });

        it('very long chain of yields works', async () => {
            const out = await task(function* () {
                const a = yield* ok(1);
                const b = yield* ok(a + 1);
                const c = yield* ok(b + 1);
                const d = yield* ok(c + 1);
                const e = yield* ok(d + 1);
                const f = yield* ok(e + 1);
                const g = yield* ok(f + 1);
                const h = yield* ok(g + 1);
                const i = yield* ok(h + 1);
                const j = yield* ok(i + 1);
                return j;
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toBe(10); // Started at 1, added 1 nine times
            }
        });
    });

    describe('Edge cases', () => {
        it('handles undefined and null values', async () => {
            const out1 = await task(function* () {
                return yield* ok(undefined);
            });
            expect(out1.isOk()).toBe(true);
            if (out1.isOk()) expect(out1.value).toBe(undefined);

            const out2 = await task(function* () {
                return yield* ok(null);
            });
            expect(out2.isOk()).toBe(true);
            if (out2.isOk()) expect(out2.value).toBe(null);
        });

        it('works with zero and false values', async () => {
            const out = await task(function* () {
                const a = yield* ok(0);
                const b = yield* ok(false);
                return { a, b };
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toEqual({ a: 0, b: false });
            }
        });

        it('handles empty objects and arrays', async () => {
            const out = await task(function* () {
                const a = yield* ok({});
                const b = yield* ok([]);
                return { a, b };
            });

            expect(out.isOk()).toBe(true);
            if (out.isOk()) {
                expect(out.value).toEqual({ a: {}, b: [] });
            }
        });

        it('throws TaskYieldNotResultError when yielding non-Result value', async () => {
            let caughtError: unknown;
            try {
                await task(function* () {
                    yield 42; // Not a Result!
                });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeInstanceOf(TaskYieldNotResultError);
            expect((caughtError as TaskYieldNotResultError).code).toBe(ERR_TASK_YIELD_NOT_RESULT);
            expect((caughtError as TaskYieldNotResultError).message).toContain(
                'task() expected yielded values to be Result. Use `yield*` on a Result.'
            );
        });

        it('handles iterator.return() throwing with onThrow', async () => {
            // Create a generator that throws when return() is called
            const generator = function* () {
                const a = yield* ok(1);
                const _b = yield* err('error');
                return a;
            };
            
            const iterator = generator();
            // Override return() to throw
            const originalReturn = iterator.return.bind(iterator);
            iterator.return = function(value: unknown) {
                throw new Error('Iterator return failed');
            };
            
            const makeGenerator = () => iterator as any;
            
            const out = await task(
                makeGenerator,
                (error) => ({ mapped: true, original: String(error) })
            );

            // The error from iterator.return() should be caught and mapped
            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toEqual({ mapped: true, original: 'Error: Iterator return failed' });
            }
        });

        it('handles iterator.return() throwing without onThrow', async () => {
            // Create a generator that throws when return() is called
            const generator = function* () {
                const a = yield* ok(1);
                const _b = yield* err('error');
                return a;
            };
            
            const iterator = generator();
            // Override return() to throw
            iterator.return = function(value: unknown) {
                throw new Error('Iterator return failed');
            };
            
            const makeGenerator = () => iterator as any;

            // Without onThrow, the error should be rethrown
            await expect(
                task(makeGenerator)
            ).rejects.toThrow('Iterator return failed');
        });

        it('handles exception during return value await with onThrow', async () => {
            // Test the catch block when awaiting the return value throws
            const generator = function* () {
                yield* ok(1);
                // Return a promise that rejects
                return Promise.reject(new Error('Return value failed'));
            };
            
            const out = await task(
                generator,
                (error) => ({ mapped: true, original: String(error) })
            );

            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toEqual({ mapped: true, original: 'Error: Return value failed' });
            }
        });

        it('handles exception during return value await without onThrow', async () => {
            // Test the catch block when awaiting the return value throws
            const generator = function* () {
                yield* ok(1);
                // Return a promise that rejects
                return Promise.reject(new Error('Return value failed'));
            };
            
            // Without onThrow, the error should be rethrown
            await expect(
                task(generator)
            ).rejects.toThrow('Return value failed');
        });

        it('handles unreachable case (Result neither Ok nor Err)', async () => {
            // Create a malformed Result that bypasses type checking
            const malformedResult = {
                isOk: () => false,
                isErr: () => false,
                value: undefined,
                error: undefined,
            } as unknown as Result<number, string>;

            // Create a generator that yields this malformed result
            let caughtError: unknown;
            try {
                await task(function* () {
                    yield malformedResult as any;
                });
            } catch (error) {
                caughtError = error;
            }

            expect(caughtError).toBeInstanceOf(InvalidResultStateError);
            expect((caughtError as InvalidResultStateError).code).toBe(ERR_INVALID_STATE);
            expect((caughtError as InvalidResultStateError).message).toContain('Unreachable: Result is neither Ok nor Err');
        });

        it('handles iterator without return() method', async () => {
            // Create a custom iterator without return() method
            const customIterator = {
                next() {
                    return { done: false, value: err('error') };
                },
                // No return() method
            };
            
            const makeGenerator = () => customIterator as any;
            
            const out = await task(makeGenerator);
            
            // Should handle gracefully even without return() method
            expect(out.isErr()).toBe(true);
            if (out.isErr()) {
                expect(out.error).toBe('error');
            }
        });
    });
});
