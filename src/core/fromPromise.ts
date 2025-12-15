import type { Result } from './result';
import { ok, err } from './result';

/**
 * Konvertiert ein Promise zu einem Result-Promise.
 * Exceptions werden zu Err konvertiert.
 */
export function fromPromise<T>(promise: Promise<T>): Promise<Result<T, unknown>>;
export function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>>;
export async function fromPromise<T, E>(promise: Promise<T>, errorMapper?: (error: unknown) => E): Promise<Result<T, E>> {
    try {
        const value = await promise;
        return ok(value);
    } catch (error) {
        try {
            return err(errorMapper ? errorMapper(error) : error as E);
        } catch (mapperError) {
            // Wenn der errorMapper selbst einen Error wirft, verwende diesen
            return err(mapperError as E);
        }
    }
}