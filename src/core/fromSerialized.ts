import type { Result, ResultType } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Rebuilds a `Result` from its serialized discriminated form
 * (`{ _tag: 'Ok', value }` / `{ _tag: 'Err', error }`), the shape produced
 * by `Result.toSerialized()` and by `JSON.stringify` on a Result.
 *
 * Throws `InvalidResultStateError` for data that is not in that shape.
 */
export function fromSerialized<T, E>(data: ResultType<T, E>): Result<T, E> {
    if (data !== null && typeof data === 'object') {
        if (data._tag === 'Ok' && 'value' in data) return ok<T, E>(data.value);
        if (data._tag === 'Err' && 'error' in data) return err<E, T>(data.error);
    }
    throw new InvalidResultStateError('fromSerialized');
}
