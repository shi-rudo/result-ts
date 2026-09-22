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
 * `fromSerialized` only checks the envelope, the `_tag` discriminant plus the
 * absence of an own key of the other state, never the payload itself, while its
 * type parameters claim `T` and `E` for whatever `JSON.parse` returned. It
 * also throws for malformed input at exactly the boundary where a Result
 * should be returned. Validate foreign data with your schema tool and
 * then call `ok`/`err`; the shape is exported as `ResultType<T, E>`. This
 * function will be removed in 2.0.
 */
export function fromSerialized<T, E>(data: ResultType<T, E>): Result<T, E> {
    if (data !== null && typeof data === 'object') {
        // The key is absent only where `T` or `E` admits `undefined`, see `ResultType`.
        if (data._tag === 'Ok' && !Object.hasOwn(data, 'error')) return ok<T, E>(data.value as T);
        if (data._tag === 'Err' && !Object.hasOwn(data, 'value')) return err<E, T>(data.error as E);
    }
    throw new InvalidResultStateError('fromSerialized');
}
