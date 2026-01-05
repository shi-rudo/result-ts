import type { Result } from '../result';

type OkValueOf<R> = R extends Result<infer T, any> ? T : never;
type ErrValueOf<R> = R extends Result<any, infer E> ? E : never;

/**
 * Partitions Results into Ok values and Err errors.
 */
export function partition<const Results extends readonly Result<any, any>[]>(
    results: Results
): [oks: Array<OkValueOf<Results[number]>>, errs: Array<ErrValueOf<Results[number]>>] {
    const oks: Array<OkValueOf<Results[number]>> = [];
    const errs: Array<ErrValueOf<Results[number]>> = [];

    for (const result of results) {
        if (result.isOk()) {
            oks.push(result.value as OkValueOf<Results[number]>);
            continue;
        }
        if (result.isErr()) {
            errs.push(result.error as ErrValueOf<Results[number]>);
            continue;
        }
        throw new Error('Unreachable: Result is neither Ok nor Err');
    }

    return [oks, errs];
}
