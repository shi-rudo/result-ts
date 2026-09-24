import type { Result, SerializedResult } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

const EXPECTED_SHAPE = "expected { _tag: 'Ok', value } or { _tag: 'Err', error }";

/**
 * Rebuilds a `Result` from its serialized shape, the counterpart of
 * `Result.toSerialized()`. It also accepts what `JSON.stringify` produces for
 * a Result, including an `Ok(undefined)` without the `value` key.
 *
 * It checks the envelope: the `_tag` and the absence of an own key of the
 * other state. It does not check the payload. For foreign data, validate the
 * payload with your schema tool first, so that `T` and `E` are true.
 *
 * Throws `InvalidResultStateError` for data that is not in that shape.
 */
export function fromSerialized<T, E>(data: SerializedResult<T, E>): Result<T, E> {
    if (data !== null && typeof data === 'object') {
        // Reading the envelope runs code of the payload: `Object.hasOwn` calls
        // the `getOwnPropertyDescriptor` trap of a Proxy, and the discriminant
        // can be a getter. A payload that throws there is not a serialized
        // Result, and the coded error of this library says so.
        try {
            // The key is absent only where `T` or `E` admits `undefined`, see `SerializedResult`.
            if (data._tag === 'Ok' && !Object.hasOwn(data, 'error')) return ok<T, E>(data.value as T);
            if (data._tag === 'Err' && !Object.hasOwn(data, 'value')) return err<E, T>(data.error as E);
        } catch (error) {
            const invalid = new InvalidResultStateError('fromSerialized', EXPECTED_SHAPE);
            invalid.cause = error;
            throw invalid;
        }
    }
    throw new InvalidResultStateError('fromSerialized', EXPECTED_SHAPE);
}
