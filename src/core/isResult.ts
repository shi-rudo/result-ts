import { RESULT_BRAND } from './brand';
import type { Result } from './result';

type ResultLikeObject = {
    readonly [RESULT_BRAND]?: unknown;
    readonly _tag?: unknown;
    readonly isOk?: unknown;
    readonly isErr?: unknown;
};

const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

const hasResultMethods = (value: ResultLikeObject): boolean => {
    return typeof value.isOk === 'function' && typeof value.isErr === 'function';
};

const hasValidPayload = (value: object & ResultLikeObject): boolean => {
    if (value._tag === 'Ok') {
        return hasOwn(value, 'value') && !hasOwn(value, 'error');
    }
    if (value._tag === 'Err') {
        return hasOwn(value, 'error') && !hasOwn(value, 'value');
    }
    return false;
};

/**
 * Checks whether a value is a Result.
 * Pure function alternative for runtime checks.
 */
export function isResult(value: unknown): value is Result<any, any> {
    if (value === null || typeof value !== 'object') return false;

    const candidate = value as object & ResultLikeObject;
    return candidate[RESULT_BRAND] === true && hasResultMethods(candidate) && hasValidPayload(candidate);
}
