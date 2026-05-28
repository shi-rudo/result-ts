import { describe, expect, it } from 'vitest';

import { InvalidResultStateError } from '../errors';
import { RESULT_BRAND } from './brand';
import { collectAllErrors } from './collectAllErrors';
import { collectFirstOk } from './collectFirstOk';
import { collectFirstOkParallelAsync } from './collectFirstOkParallelAsync';
import { fold } from './fold';
import { foldAsync } from './foldAsync';
import { mapBoth } from './mapBoth';
import { mapOrElse } from './mapOrElse';
import { match } from './match';
import { matchAsync } from './matchAsync';
import { orElse } from './orElse';
import { partition } from './partition';
import { recover, recoverWith } from './recover';
import type { Result } from './result';
import { err, ok } from './result';
import { sequence } from './sequence';
import { sequenceRecord } from './sequenceRecord';
import { swap } from './swap';
import { tap } from './tap';
import { tapAsync } from './tapAsync';
import { toPromise } from './toPromise';
import { unwrap } from './unwrap';
import { unwrapErr } from './unwrapErr';
import { unwrapOrElse } from './unwrapOrElse';
import { unwrapOrThrow } from './unwrapOrThrow';
import { combine, zip } from './zip';

describe('pipe operators invalid Result state handling', () => {
    const malformed = {
        isOk: () => false,
        isErr: () => false,
    } as unknown as Result<number, string>;
    const brandedMalformed = {
        [RESULT_BRAND]: true,
        _tag: 'Ok',
        value: 0,
        isOk: () => false,
        isErr: () => false,
    } as unknown as Result<number, string>;

    it('throws InvalidResultStateError from synchronous operators', () => {
        expect(() => fold<number, string, number>({
            ok: value => value,
            err: error => error.length,
        })(malformed)).toThrow(InvalidResultStateError);

        expect(() => collectAllErrors([malformed])).toThrow(InvalidResultStateError);
        expect(() => collectFirstOk([malformed])).toThrow(InvalidResultStateError);
        expect(() => mapBoth((value: number) => value + 1, (error: string) => error.length)(malformed)).toThrow(InvalidResultStateError);
        expect(() => mapOrElse(malformed, error => error.length, value => value)).toThrow(InvalidResultStateError);
        expect(() => match<number, string, number>({
            ok: value => value,
            err: error => error.length,
        })(malformed)).toThrow(InvalidResultStateError);
        expect(() => orElse(malformed, () => ok(0))).toThrow(InvalidResultStateError);
        expect(() => partition([malformed])).toThrow(InvalidResultStateError);
        expect(() => recover<number, string, number>(0)(malformed)).toThrow(InvalidResultStateError);
        expect(() => recoverWith<number, string, number>(error => error.length)(malformed)).toThrow(InvalidResultStateError);
        expect(() => sequence([malformed])).toThrow(InvalidResultStateError);
        expect(() => sequenceRecord({ value: brandedMalformed })).toThrow(InvalidResultStateError);
        expect(() => swap(malformed)).toThrow(InvalidResultStateError);
        expect(tap<number, string>({})(ok(1))).toEqual(ok(1));
        expect(() => tap<number, string>({})(malformed)).toThrow(InvalidResultStateError);
        expect(() => toPromise(malformed)).toThrow(InvalidResultStateError);
        expect(() => unwrap(malformed)).toThrow(InvalidResultStateError);
        expect(() => unwrapErr(malformed)).toThrow(InvalidResultStateError);
        expect(() => unwrapOrElse(malformed, error => error.length)).toThrow(InvalidResultStateError);
        expect(() => unwrapOrThrow(malformed)).toThrow(InvalidResultStateError);
        expect(() => zip(malformed, ok(1))).toThrow(InvalidResultStateError);
        expect(() => combine(malformed, ok(1))).toThrow(InvalidResultStateError);
        expect(() => combine(ok(1), malformed)).toThrow(InvalidResultStateError);
    });

    it('rejects InvalidResultStateError from async operators', async () => {
        await expect(collectFirstOkParallelAsync([])).resolves.toEqual(err([]));
        await expect(foldAsync<number, string, number>({
            ok: async value => value,
            err: async error => error.length,
        })(malformed)).rejects.toThrow(InvalidResultStateError);

        await expect(matchAsync<number, string, number>({
            ok: async value => value,
            err: async error => error.length,
        })(malformed)).rejects.toThrow(InvalidResultStateError);
        await expect(tapAsync<number, string>({})(ok(1))).resolves.toEqual(ok(1));
        await expect(tapAsync<number, string>({})(malformed)).rejects.toThrow(InvalidResultStateError);
        await expect(collectFirstOkParallelAsync([Promise.resolve(brandedMalformed)])).rejects.toThrow(InvalidResultStateError);
    });
});
