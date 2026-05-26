import { Err, Ok, type Result } from './result';

/**
 * Checks whether a value is a Result.
 * Pure function alternative for runtime checks.
 */
export function isResult(value: unknown): value is Result<any, any> {
    return value instanceof Ok || value instanceof Err;
}
