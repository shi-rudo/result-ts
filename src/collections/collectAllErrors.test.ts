import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from '../index';
import { collectAllErrors } from './collectAllErrors';

describe('collectAllErrors', () => {
    it('returns Ok(values) when all are Ok', () => {
        const out = collectAllErrors([ok(1), ok(2)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2]);
        }
    });

    it('returns Err(errors) when any Err is present', () => {
        const out = collectAllErrors([ok(1), err('e1'), ok(2), err('e2')]);
        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toEqual(['e1', 'e2']);
        }
    });

    it('returns Ok([]) for empty input', () => {
        const out = collectAllErrors([] as Array<Result<number, string>>);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([]);
        }
    });
});
