import type { Awaitable } from './pipeable';
import type { Result } from './result';
import { err, ok } from './result';

type CollectFirstOkAsyncInput = Promise<Result<any, any>> | (() => Awaitable<Result<any, any>>);

type ResolvedResult<I> = I extends () => infer R ? Awaited<R> : I extends Promise<infer R> ? R : never;
type OkValueOfInput<I> = ResolvedResult<I> extends Result<infer T, any> ? T : never;
type ErrValueOfInput<I> = ResolvedResult<I> extends Result<any, infer E> ? E : never;

/**
 * Parallel-Variante von `collectFirstOkAsync`.
 *
 * - Startet alle Inputs sofort (Promises oder Thunks).
 * - Gibt das erste `Ok` zurück, sobald es verfügbar ist.
 * - Wenn kein `Ok` gefunden wird, gibt ein `Err` mit allen Error-Werten (in Input-Reihenfolge) zurück.
 * - Rejections werden als `ErrValue` behandelt (`caught as ErrValue`).
 * - Wenn mehrere Inputs ein `Ok` liefern, gewinnt das zuerst abgeschlossene Ergebnis.
 *   Bei gleichzeitiger Completion gewinnt das zuerst beobachtete Ergebnis.
 * - Wenn kein `Ok` kommt und mindestens ein Input nie settled, bleibt das Promise offen.
 */
export async function collectFirstOkParallelAsync<const Inputs extends readonly CollectFirstOkAsyncInput[]>(
    inputs: Inputs
): Promise<Result<OkValueOfInput<Inputs[number]>, ErrValueOfInput<Inputs[number]>[]>> {
    type OkValue = OkValueOfInput<Inputs[number]>;
    type ErrValue = ErrValueOfInput<Inputs[number]>;

    if (inputs.length === 0) {
        return err<ErrValue[], OkValue>([]);
    }

    const started = inputs.map((input) =>
        typeof input === 'function' ? Promise.resolve().then(input) : input
    );

    const firstOk = new Promise<Result<OkValue, ErrValue[]>>((resolve) => {
        for (const promise of started) {
            promise
                .then((result) => {
                    if (result.isOk()) {
                        resolve(ok<OkValue, ErrValue[]>(result.value as OkValue));
                    }
                })
                .catch(() => {
                    // Ignored here; handled in allSettled below.
                });
        }
    });

    const allErrors = Promise.allSettled(started).then((settled) => {
        const errors: ErrValue[] = [];
        for (const entry of settled) {
            if (entry.status === 'fulfilled') {
                const result = entry.value;
                if (result.isErr()) {
                    errors.push(result.error as ErrValue);
                } else if (!result.isOk()) {
                    errors.push(new Error('Unreachable: Result is neither Ok nor Err') as ErrValue);
                }
            } else {
                errors.push(entry.reason as ErrValue);
            }
        }
        return err<ErrValue[], OkValue>(errors);
    });

    return Promise.race([firstOk, allErrors]);
}
