import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { combine, zip } from './zip';

describe('zip', () => {
    it('kombiniert zwei Ok zu Ok([a, b])', () => {
        const result = zip(ok(1), ok('a'));
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const tuple: [number, string] = result.value;
            expect(tuple).toEqual([1, 'a']);
        }
    });

    it('short-circuits beim ersten Err', () => {
        const leftErr = zip(Result.err('left'), ok('a'));
        expect(leftErr.isErr()).toBe(true);
        if (leftErr.isErr()) {
            expect(leftErr.error).toBe('left');
        }

        const rightErr = zip(ok(1), Result.err('right'));
        expect(rightErr.isErr()).toBe(true);
        if (rightErr.isErr()) {
            expect(rightErr.error).toBe('right');
        }
    });

    it('funktioniert als Pipe-Operator', () => {
        const result = ok(1).pipe(zip(ok('a')));
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const tuple: [number, string] = result.value;
            expect(tuple).toEqual([1, 'a']);
        }
    });
});

describe('combine', () => {
    it('kombiniert zwei Ok zu Ok([a, b])', () => {
        const result = combine(ok(1), ok('a'));
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual([1, 'a']);
        }
    });

    it('sammelt Fehler ein', () => {
        const oneErr = combine(Result.err('left'), ok('a'));
        expect(oneErr.isErr()).toBe(true);
        if (oneErr.isErr()) {
            expect(oneErr.error).toEqual(['left']);
        }

        const bothErr = combine(Result.err('left'), Result.err('right'));
        expect(bothErr.isErr()).toBe(true);
        if (bothErr.isErr()) {
            expect(bothErr.error).toEqual(['left', 'right']);
        }
    });

    it('funktioniert als Pipe-Operator', () => {
        const result = ok(1).pipe(combine(Result.err('right')));
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toEqual(['right']);
        }
    });
});

