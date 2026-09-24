import { describe, expect, it } from 'vitest';

import { err, ok, type Result, type SerializedResult } from './result';
import { fromSerialized } from './fromSerialized';
import { InvalidResultStateError } from '../errors';

describe('fromSerialized', () => {
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
        const parsed: SerializedResult<void, string> = JSON.parse(JSON.stringify(ok()));

        const restored = fromSerialized(parsed);

        expect(restored.isOk()).toBe(true);
        expect(restored.unwrap()).toBeUndefined();
    });

    it('rebuilds Err(undefined) from JSON that dropped the undefined error key', () => {
        const parsed: SerializedResult<number, undefined> = JSON.parse(JSON.stringify(err<undefined, number>(undefined)));

        const restored = fromSerialized(parsed);

        expect(restored.isErr()).toBe(true);
        expect(restored.unwrapErr()).toBeUndefined();
    });

    it('rejects a payload that carries the key of the other state', () => {
        expect(() => fromSerialized({ _tag: 'Ok', error: 'boom' } as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized({ _tag: 'Err', value: 42 } as never)).toThrow(InvalidResultStateError);
    });

    it('ignores a key of the other state that sits on the prototype chain', () => {
        const inherited = Object.assign(Object.create({ error: 'inherited' }), { _tag: 'Ok' as const, value: 1 });

        const restored = fromSerialized<number, string>(inherited);

        expect(restored.unwrap()).toBe(1);
    });

    it('rejects a payload whose envelope throws while it is read, and keeps the cause', () => {
        const trap = new Error('getOwnPropertyDescriptor trap is hostile');
        const hostile = new Proxy({ _tag: 'Ok', value: 1 }, {
            getOwnPropertyDescriptor(): PropertyDescriptor {
                throw trap;
            },
        });

        let caught: unknown;
        try {
            fromSerialized(hostile as never);
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(InvalidResultStateError);
        expect((caught as InvalidResultStateError).cause).toBe(trap);
    });

    it('rejects malformed serialized data and names the expected shape', () => {
        expect(() => fromSerialized({ _tag: 'Nope' } as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized({ _tag: 'Nope' } as never)).toThrow("expected { _tag: 'Ok', value } or { _tag: 'Err', error }");
        expect(() => fromSerialized(null as never)).toThrow(InvalidResultStateError);
        expect(() => fromSerialized('Ok' as never)).toThrow(InvalidResultStateError);
    });

    it('produces real Result instances', () => {
        const restored = fromSerialized({ _tag: 'Ok', value: 1 });

        expect(restored.pipe).toBeTypeOf('function');
        expect(restored.isOk()).toBe(true);
    });
});
