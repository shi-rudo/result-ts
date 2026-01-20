import type { Result } from './result';

/**
 * Checks whether a value is a Result.
 * Pure function alternative for runtime checks.
 */
export function isResult(value: unknown): value is Result<any, any> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'isOk' in value &&
        typeof (value as { isOk?: unknown }).isOk === 'function' &&
        'isErr' in value &&
        typeof (value as { isErr?: unknown }).isErr === 'function'
    );
}
