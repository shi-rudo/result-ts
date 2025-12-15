import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { sequenceRecord } from './sequenceRecord';

describe('sequenceRecord', () => {
    it('gibt Ok(record) zurück wenn alle Ok sind', () => {
        const result = sequenceRecord({ a: ok(1), b: ok('x') } as const);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual({ a: 1, b: 'x' });
            const a: number = result.value.a;
            const b: string = result.value.b;
            expect([a, b]).toEqual([1, 'x']);
        }
    });

    it('short-circuits beim ersten Err', () => {
        const result = sequenceRecord({ a: ok(1), b: Result.err('boom'), c: ok(3) } as const);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('boom');
        }
    });
});

