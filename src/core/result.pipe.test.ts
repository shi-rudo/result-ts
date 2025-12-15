import { describe, expect, it, vi } from 'vitest';

import { Result, filter, filterAsync, flatMap, flatMapAsync, map, mapAsync, mapErr, mapErrAsync, match, matchAsync, ok, err, tap, tapAsync, tryCatch, tryCatchAsync, tryMap, tryMapAsync } from './result';

describe('Result.pipe', () => {
    it('gibt ohne Operatoren die gleiche Instanz zurück', () => {
        const r = ok(1);
        expect(r.pipe()).toBe(r);
    });

    it('verkettet Funktionen von links nach rechts', () => {
        const out = ok<number, string>(2).pipe(
            (res) => res.unwrapOr(0),
            (n) => n * 2,
            (n) => `n=${n}`,
        );

        expect(out).toBe('n=4');
    });

    it('funktioniert mit pipeable Operators im Ok-Fall', () => {
        const out = ok<number, string>(2).pipe(
            map((n) => n + 1),
            flatMap((n) => ok<number, string>(n * 3)),
            match({ ok: (v) => v, err: () => -1 }),
        );

        expect(out).toBe(9);
    });

    it('überspringt map bei Err und kann mapErr anwenden', () => {
        const project = vi.fn((n: number) => n + 1);
        const projectErr = vi.fn((e: string) => `wrapped: ${e}`);

        const out = Result.err<string, number>('boom').pipe(
            map(project),
            mapErr(projectErr),
            match({ ok: () => 'ok', err: (e) => e }),
        );

        expect(project).not.toHaveBeenCalled();
        expect(projectErr).toHaveBeenCalledWith('boom');
        expect(out).toBe('wrapped: boom');
    });

    it('kann in der Pipe auch zu Err wechseln', () => {
        const out = ok<number, string>(2).pipe(
            filter((n) => n > 2, () => 'too small'),
            match({ ok: () => 'ok', err: (e) => e }),
        );

        expect(out).toBe('too small');
    });

    it('pipet mehrere Result-Operatoren hintereinander', () => {
        const seen: Array<string> = [];

        const out = ok<number, string>(1).pipe(
            tap({ ok: (v) => seen.push(`start:${v}`) }),
            map((v) => v + 1),
            tap({ ok: (v) => seen.push(`afterMap:${v}`) }),
            filter((v) => v % 2 === 0, () => 'odd'),
            tap({ ok: (v) => seen.push(`afterFilter:${v}`) }),
            flatMap((v) => ok<number, string>(v * 10)),
            match({ ok: (v) => v, err: () => -1 }),
        );

        expect(out).toBe(20);
        expect(seen).toEqual(['start:1', 'afterMap:2', 'afterFilter:2']);
    });

    it('short-circuits nach Err in einer langen Pipe', () => {
        const okSpy = vi.fn();
        const errSpy = vi.fn();
        const mapSpy = vi.fn((n: number) => n + 1);

        const out = ok<number, string>(1).pipe(
            filter((n) => n > 1, () => 'too small'),
            tap({ ok: okSpy, err: errSpy }),
            map(mapSpy),
            mapErr((e) => e.toUpperCase()),
            match({ ok: (v) => `ok:${v}`, err: (e) => e }),
        );

        expect(okSpy).not.toHaveBeenCalled();
        expect(errSpy).toHaveBeenCalledWith('too small');
        expect(mapSpy).not.toHaveBeenCalled();
        expect(out).toBe('TOO SMALL');
    });

    it('pipet mehrere Result-returning Funktionen via flatMap', () => {
        const firstResult = vi.fn((n: number): Result<string, Error> => {
            if (n < 0) return Result.err<Error, string>(new Error('negative'));
            return ok(String(n));
        });

        const secondResult = vi.fn((s: string): Result<number, Error> => {
            const parsed = Number(s);
            if (!Number.isFinite(parsed)) return Result.err<Error, number>(new Error('not a number'));
            return ok(parsed);
        });

        const thirdResult = vi.fn((n: number): Result<string, Error> => {
            if (n === 0) return Result.err<Error, string>(new Error('zero'));
            return ok(n % 2 === 0 ? 'even' : 'odd');
        });

        const outOk = firstResult(2).pipe(
            flatMap(secondResult),
            flatMap(thirdResult),
            match({ ok: (v) => v, err: (e) => e.message }),
        );

        expect(outOk).toBe('even');
        expect(firstResult).toHaveBeenCalledWith(2);
        expect(secondResult).toHaveBeenCalledWith('2');
        expect(thirdResult).toHaveBeenCalledWith(2);

        firstResult.mockClear();
        secondResult.mockClear();
        thirdResult.mockClear();

        const outErr = firstResult(-1).pipe(
            flatMap(secondResult),
            flatMap(thirdResult),
            match({ ok: (v) => v, err: (e) => e.message }),
        );

        expect(outErr).toBe('negative');
        expect(firstResult).toHaveBeenCalledWith(-1);
        expect(secondResult).not.toHaveBeenCalled();
        expect(thirdResult).not.toHaveBeenCalled();
    });

    it('unterstützt lange Pipes (20 Operatoren)', () => {
        const out = ok(0).pipe(
            map((n) => {
                const typed: number = n;
                return typed + 1;
            }),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
            map((n) => n + 1),
        );

        const typed: Result<number, never> = out;
        expect(typed).toBe(out);

        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toBe(20);
        }
    });
});

describe('Result.tryCatch', () => {
    it('fängt Exceptions ab und wandelt sie in Err um', () => {
        const throwingFn = vi.fn(() => {
            throw new Error('test error');
        });

        const result = ok('any input').pipe(tryCatch(throwingFn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('test error');
        }
        expect(throwingFn).toHaveBeenCalled();
    });

    it('gibt Ok zurück wenn keine Exception geworfen wird', () => {
        const successFn = vi.fn(() => 'success result');

        const result = ok('any input').pipe(tryCatch(successFn));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('success result');
        }
        expect(successFn).toHaveBeenCalled();
    });

    it('überspringt tryCatch wenn Source bereits Err ist', () => {
        const throwingFn = vi.fn(() => {
            throw new Error('should not be called');
        });

        const result = Result.err<string, string>('original error').pipe(tryCatch(throwingFn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('original error');
        }
        expect(throwingFn).not.toHaveBeenCalled();
    });

    it('verwendet custom errorMapper um Exceptions zu transformieren', () => {
        const throwingFn = vi.fn(() => {
            throw new Error('original error');
        });

        const errorMapper = vi.fn((error: unknown) => `mapped: ${(error as Error).message}`);

        const result = ok('any input').pipe(tryCatch(throwingFn, errorMapper));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('mapped: original error');
        }
        expect(errorMapper).toHaveBeenCalledWith(new Error('original error'));
    });

    it('funktioniert in Pipes mit anderen Operatoren', () => {
        const result = ok('{"name": "test"}').pipe(
            tryCatch(() => JSON.parse('invalid json')),
            mapErr((error: unknown) => `Parse error: ${(error as Error).message}`),
            match({ ok: () => 'success', err: (e) => e })
        );

        // Node/V8 error message differs between versions.
        expect(result).toMatch(/^Parse error: Unexpected token/);
    });
});

describe('Result.tryCatchAsync', () => {
    it('fängt async Exceptions ab und wandelt sie in Err um', async () => {
        const throwingFn = vi.fn(async () => {
            throw new Error('async test error');
        });

        const result = await ok('any input').pipeAsync(tryCatchAsync(throwingFn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('async test error');
        }
        expect(throwingFn).toHaveBeenCalled();
    });

    it('gibt Ok zurück wenn keine Exception in async Funktion geworfen wird', async () => {
        const successFn = vi.fn(async () => {
            await Promise.resolve(); // simulate async
            return 'async success';
        });

        const result = await ok('any input').pipeAsync(tryCatchAsync(successFn));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe('async success');
        }
        expect(successFn).toHaveBeenCalled();
    });

    it('überspringt tryCatchAsync wenn Source bereits Err ist', async () => {
        const throwingFn = vi.fn(async () => {
            throw new Error('should not be called');
        });

        const result = await Result.err<string, string>('original error').pipeAsync(tryCatchAsync(throwingFn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('original error');
        }
        expect(throwingFn).not.toHaveBeenCalled();
    });

    it('verwendet custom errorMapper für async Exceptions', async () => {
        const throwingFn = vi.fn(async () => {
            throw new Error('async original error');
        });

        const errorMapper = vi.fn((error: unknown) => `async mapped: ${(error as Error).message}`);

        const result = await ok('any input').pipeAsync(tryCatchAsync(throwingFn, errorMapper));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('async mapped: async original error');
        }
        expect(errorMapper).toHaveBeenCalledWith(new Error('async original error'));
    });

    it('funktioniert in async Pipes mit anderen Operatoren', async () => {
        const result = await ok('invalid json').pipeAsync(
            tryCatchAsync(async () => JSON.parse('invalid json')),
            mapErr((error: unknown) => `Async parse error: ${(error as Error).message}`),
            match({ ok: () => 'success', err: (e) => e })
        );

        // Node/V8 error message differs between versions.
        expect(result).toMatch(/^Async parse error: Unexpected token/);
    });

    it('funktioniert mit Promises die Exceptions werfen', async () => {
        const throwingPromiseFn = vi.fn(() => Promise.reject(new Error('promise rejection')));

        const result = await ok('any input').pipeAsync(tryCatchAsync(throwingPromiseFn));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('promise rejection');
        }
    });
});

describe('Result.tryMap', () => {
    it('mappt Ok value und gibt Ok zurück', () => {
        const project = vi.fn((n: number) => n + 1);
        const result = ok<number, string>(1).pipe(tryMap(project));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(2);
        }
        expect(project).toHaveBeenCalledWith(1);
    });

    it('wandelt throw in Err um', () => {
        const project = vi.fn(() => {
            throw new Error('boom');
        });

        const result = ok<number, string>(1).pipe(tryMap(project));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('boom');
        }
    });

    it('verwendet errorMapper um Exceptions zu transformieren', () => {
        const project = vi.fn(() => {
            throw new Error('boom');
        });

        const result = ok<number, string>(1).pipe(tryMap(project, (e) => `mapped:${(e as Error).message}`));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('mapped:boom');
        }
    });

    it('überspringt tryMap wenn Source bereits Err ist', () => {
        const project = vi.fn(() => 123);
        const source = err('original error');

        const result = source.pipe(tryMap(project));

        expect(result).toBe(source);
        expect(project).not.toHaveBeenCalled();
    });
});

describe('Result.tryMapAsync', () => {
    it('mappt async Ok value und gibt Ok zurück', async () => {
        const project = vi.fn(async (n: number) => n + 1);
        const result = await ok<number, string>(1).pipeAsync(tryMapAsync(project));

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(2);
        }
        expect(project).toHaveBeenCalledWith(1);
    });

    it('wandelt rejected Promise in Err um', async () => {
        const project = vi.fn(async () => {
            throw new Error('boom');
        });

        const result = await ok<number, string>(1).pipeAsync(tryMapAsync(project));

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('boom');
        }
    });

    it('überspringt tryMapAsync wenn Source bereits Err ist', async () => {
        const project = vi.fn(async () => 123);
        const source = err('original error');

        const result = await source.pipeAsync(tryMapAsync(project));

        expect(result).toBe(source);
        expect(project).not.toHaveBeenCalled();
    });
});

describe('Result.pipeAsync', () => {
    it('gibt ohne Operatoren die gleiche Instanz zurück', async () => {
        const r = ok(1);
        await expect(r.pipeAsync()).resolves.toBe(r);
    });

    it('verkettet sync und async Schritte in Reihenfolge', async () => {
        const out = await ok<number, string>(2).pipeAsync(
            map((n) => n + 1),
            (res) => res.unwrapOr(0),
            async (n) => n * 2,
            (n) => `n=${n}`,
        );

        expect(out).toBe('n=6');
    });

    it('pipet mehrere async Result-Funktionen hintereinander', async () => {
        const firstResult = vi.fn(async (n: number): Promise<Result<string, Error>> => {
            if (n < 0) return Result.err<Error, string>(new Error('negative'));
            return ok(String(n));
        });

        const secondResult = vi.fn(async (s: string): Promise<Result<number, Error>> => {
            const parsed = Number(s);
            if (!Number.isFinite(parsed)) return Result.err<Error, number>(new Error('not a number'));
            return ok(parsed);
        });

        const thirdResult = vi.fn(async (n: number): Promise<Result<string, Error>> => {
            if (n === 0) return Result.err<Error, string>(new Error('zero'));
            return ok(n % 2 === 0 ? 'even' : 'odd');
        });

        const outOk = await ok<number, Error>(2).pipeAsync(
            flatMapAsync(firstResult),
            flatMapAsync(secondResult),
            flatMapAsync(thirdResult),
            match({ ok: (v) => v, err: (e) => e.message }),
        );

        expect(outOk).toBe('even');
        expect(firstResult).toHaveBeenCalledWith(2);
        expect(secondResult).toHaveBeenCalledWith('2');
        expect(thirdResult).toHaveBeenCalledWith(2);

        firstResult.mockClear();
        secondResult.mockClear();
        thirdResult.mockClear();

        const outErr = await ok<number, Error>(-1).pipeAsync(
            flatMapAsync(firstResult),
            flatMapAsync(secondResult),
            flatMapAsync(thirdResult),
            matchAsync({ ok: (v) => Promise.resolve(v), err: (e) => Promise.resolve(e.message) }),
        );

        expect(outErr).toBe('negative');
        expect(firstResult).toHaveBeenCalledWith(-1);
        expect(secondResult).not.toHaveBeenCalled();
        expect(thirdResult).not.toHaveBeenCalled();
    });

    it('funktioniert auch mit async Operators (mapAsync / tapAsync / filterAsync)', async () => {
        const seen: Array<string> = [];

        const out = await ok<number, string>(1).pipeAsync(
            tapAsync({ ok: async (v) => { seen.push(`start:${v}`); } }),
            mapAsync(async (v) => v + 1),
            tapAsync({ ok: async (v) => { seen.push(`afterMap:${v}`); } }),
            filterAsync(async (v) => v % 2 === 0, async () => 'odd'),
            mapErrAsync(async (e) => `wrapped:${e}`),
            match({ ok: (v) => v, err: (e) => e.length }),
        );

        expect(out).toBe(2);
        expect(seen).toEqual(['start:1', 'afterMap:2']);
    });

    describe('filter coverage', () => {
        it('filter gibt source zurück bei Err', () => {
            const result = err('original error');
            const filtered = result.pipe(filter(() => true, () => 'filtered'));
            expect(filtered).toBe(result);
        });
    });

    describe('filterAsync coverage', () => {
        it('filterAsync gibt source zurück bei Err', async () => {
            const result = err('original error');
            const filtered = await result.pipeAsync(filterAsync(async () => true, async () => 'filtered'));
            expect(filtered).toBe(result);
        });

        it('filterAsync führt errorFn aus bei Ok aber false predicate', async () => {
            const result = ok(5);
            const filtered = await result.pipeAsync(filterAsync(async (v) => v > 10, async () => 'too small'));
            expect(filtered.isErr()).toBe(true);
            if (filtered.isErr()) {
                expect(filtered.error).toBe('too small');
            }
        });
    });

    describe('mapAsync coverage', () => {
        it('mapAsync gibt source zurück bei Err', async () => {
            const result = err('original error');
            const mapped = await result.pipeAsync(mapAsync(async (v) => v * 2));
            expect(mapped).toBe(result);
        });
    });

    describe('tapAsync coverage', () => {
        it('tapAsync führt ok callback aus', async () => {
            const seen: string[] = [];
            const result = ok(42);
            await result.pipeAsync(tapAsync({
                ok: async (v) => { seen.push(`ok:${v}`); return Promise.resolve(); },
                err: async (e) => { seen.push(`err:${e}`); return Promise.resolve(); }
            }));
            expect(seen).toEqual(['ok:42']);
        });

        it('tapAsync führt err callback aus', async () => {
            const seen: string[] = [];
            const result = err('error');
            await result.pipeAsync(tapAsync({
                ok: async (v) => { seen.push(`ok:${v}`); return Promise.resolve(); },
                err: async (e) => { seen.push(`err:${e}`); return Promise.resolve(); }
            }));
            expect(seen).toEqual(['err:error']);
        });
    });
});
