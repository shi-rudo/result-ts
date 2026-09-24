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

    it('rejects an array, which belongs to sequence()', () => {
        expect(() => sequenceRecord([ok(1), ok(2)] as never)).toThrow(InvalidResultStateError);
        expect(() => sequenceRecord([ok(1), ok(2)] as never)).toThrow('received an array; use sequence() for a list');
    });

    it('sequences a record that holds a Result under the key length', () => {
        expect(sequenceRecord({ length: ok(3) }).unwrap()).toEqual({ length: 3 });
    });

    it('keeps a non-enumerable own property that holds a Result', () => {
        const record = Object.defineProperty(
            { a: ok(1) } as { a: Result<number, never>; b: Result<number, never> },
            'b',
            { value: ok(2), enumerable: false }
        );

        const result = sequenceRecord(record);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toEqual({ a: 1, b: 2 });
    });

    it('ignores non-enumerable own properties', () => {
        const record = Object.defineProperty({ a: ok(1) }, 'hidden', { value: 'not a Result', enumerable: false });

        const result = sequenceRecord(record);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toEqual({ a: 1 });
    });

    it('ignores a non-enumerable symbol property', () => {
        const hidden = Symbol('hidden');
        const record = Object.defineProperty({ a: ok(1) }, hidden, { value: 'not a Result', enumerable: false });

        const result = sequenceRecord(record);

        expect(result.isOk()).toBe(true);
        expect(result.unwrap()).toEqual({ a: 1 });
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
        expect(() => sequenceRecord(record)).toThrow('property b holds undefined, not a Result');
    });
});
