import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from './result';
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
