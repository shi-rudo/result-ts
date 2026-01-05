import type { Result } from '../result';

export function isResult(value: unknown): value is Result<any, any> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'isOk' in value &&
        typeof (value as any).isOk === 'function' &&
        'isErr' in value &&
        typeof (value as any).isErr === 'function'
    );
}
