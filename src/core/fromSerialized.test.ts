import { describe, expect, it } from 'vitest';

import { err, ok, type Result, type ResultType } from './result';
import { fromSerialized } from './fromSerialized';
import { InvalidResultStateError } from '../errors';

// fromSerialized is deprecated and scheduled for removal in 2.0. These tests
// pin its behavior until then; toSerialized() itself is covered in result.test.ts.
describe('fromSerialized (deprecated)', () => {
    it('round-trips Ok and Err', () => {
        const okResult: Result<number, string> = ok(42);
        const errResult: Result<number, string> = err('boom');

        expect(fromSerialized(okResult.toSerialized()).unwrap()).toBe(42);
        expect(fromSerialized(errResult.toSerialized()).unwrapErr()).toBe('boom');
    });

    it('round-trips Ok(undefined) unambiguously', () => {
        const roundTripped = fromSerialized(ok(undefined).toSerialized());
        expect(roundTripped.isOk()).toBe(true);
        expect(roundTripped.unwrap()).toBeUndefined();
    });

    it('rebuilds Ok(undefined) from JSON that dropped the undefined value key', () => {
        const parsed: ResultType<void, string> = JSON.parse(JSON.stringify(ok()));

        const restored = fromSerialized(parsed);

        expect(restored.isOk()).toBe(true);
        expect(restored.unwrap()).toBeUndefined();
    });

    it('rebuilds Err(undefined) from JSON that dropped the undefined error key', () => {
        const parsed: ResultType<number, undefined> = JSON.parse(JSON.stringify(err<undefined, number>(undefined)));

        const restored = fromSerialized(parsed);

        expect(restored.isErr()).toBe(true);
        expect(restored.unwrapErr()).toBeUndefined();
    });

    it('rejects a payload that carries the key of the other state', () => {
        expect(() => fromSerialized({ _tag: 'Ok', error: 'boom' } as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized({ _tag: 'Err', value: 42 } as never)).toThrow(InvalidResultStateError);
    });

    it('rejects malformed serialized data', () => {
        expect(() => fromSerialized({ _tag: 'Nope' } as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized(null as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized('Ok' as never)).toThrow(InvalidResultStateError);
    });

    it('produces real Result instances', () => {
        const restored = fromSerialized({ _tag: 'Ok', value: 1 });
        expect(restored.pipe).toBeTypeOf('function');
        expect(restored.isOk()).toBe(true);
    });
});
