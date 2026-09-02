import type { Result, ResultType } from './result';
import { err, ok } from './result';
import { InvalidResultStateError } from '../errors';

/**
 * Rebuilds a `Result` from its serialized discriminated form
 * (`{ _tag: 'Ok', value }` / `{ _tag: 'Err', error }`), the shape produced
 * by `Result.toSerialized()` and by `JSON.stringify` on a Result.
 *
 * Throws `InvalidResultStateError` for data that is not in that shape.
 *
 * @deprecated Rebuild the Result yourself after validating the payload:
 *
 * ```ts
 * const restored = parsed._tag === 'Ok' ? ok(parsed.value) : err(parsed.error);
 * ```
 *
 * `fromSerialized` only checks the envelope (`_tag` plus the presence of
 * `value`/`error`), never the payload, while its type parameters claim `T`
 * and `E` for whatever `JSON.parse` returned. It also throws for malformed
 * input at exactly the boundary where a Result should be returned. Validate
 * foreign data with your schema tool and then call `ok`/`err`; the shape is
 * exported as `ResultType<T, E>`. This function will be removed in 2.0.
 */
export function fromSerialized<T, E>(data: ResultType<T, E>): Result<T, E> {
    if (data !== null && typeof data === 'object') {
        if (data._tag === 'Ok' && 'value' in data) return ok<T, E>(data.value);
        if (data._tag === 'Err' && 'error' in data) return err<E, T>(data.error);
    }
    throw new InvalidResultStateError('fromSerialized');
}
