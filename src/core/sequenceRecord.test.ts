import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { InvalidResultStateError } from '../errors';
import { sequenceRecord } from './sequenceRecord';

describe('sequenceRecord', () => {
    it('returns Ok(record) if all are Ok', () => {
        const result = sequenceRecord({ a: ok(1), b: ok('x') } as const);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual({ a: 1, b: 'x' });
            const a: number = result.value.a;
            const b: string = result.value.b;
            expect([a, b]).toEqual([1, 'x']);
        }
    });

    it('preserves symbol keys', () => {
        const id = Symbol('id');
        const result = sequenceRecord({ [id]: ok(1), name: ok('alice') } as const);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value[id]).toBe(1);
            expect(result.value.name).toBe('alice');
            const symbolValue: number = result.value[id];
            expect(symbolValue).toBe(1);
        }
    });

    it('short-circuits on first Err', () => {
        const result = sequenceRecord({ a: ok(1), b: Result.err('boom'), c: ok(3) } as const);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBe('boom');
        }
    });

    it('throws for missing or malformed Result values instead of returning partial Ok', () => {
        const record = { a: ok(1), b: undefined } as unknown as Record<string, Result<number, string>>;

        expect(() => sequenceRecord(record)).toThrow(InvalidResultStateError);
    });
});
