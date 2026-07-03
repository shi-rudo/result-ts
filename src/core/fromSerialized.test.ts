import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from './result';
import { fromSerialized } from './fromSerialized';
import { InvalidResultStateError } from '../errors';

describe('toSerialized / fromSerialized round-trip', () => {
    it('serializes Ok into the discriminated shape', () => {
        expect(ok(42).toSerialized()).toEqual({ _tag: 'Ok', value: 42 });
    });

    it('serializes Err into the discriminated shape', () => {
        expect(err('boom').toSerialized()).toEqual({ _tag: 'Err', error: 'boom' });
    });

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

    it('round-trips through JSON', () => {
        const parsed = JSON.parse(JSON.stringify(ok({ id: 1 }).toSerialized()));
        const restored = fromSerialized<{ id: number }, never>(parsed);
        expect(restored.unwrap()).toEqual({ id: 1 });
    });

    it('rejects malformed serialized data', () => {
        expect(() => fromSerialized({ _tag: 'Nope' } as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized(null as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized('Ok' as never)).toThrow(InvalidResultStateError);
    });

    it('fromSerialized produces real Result instances', () => {
        const restored = fromSerialized({ _tag: 'Ok', value: 1 });
        expect(restored.pipe).toBeTypeOf('function');
        expect(restored.isOk()).toBe(true);
    });
});
