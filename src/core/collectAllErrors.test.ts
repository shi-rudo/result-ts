import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { collectAllErrors } from './collectAllErrors';

describe('collectAllErrors', () => {
    it('gibt Ok(values) zurück wenn alle Ok sind', () => {
        const out = collectAllErrors([ok(1), ok(2)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2]);
        }
    });

    it('gibt Err(errors) zurück wenn ein Err vorhanden ist', () => {
        const out = collectAllErrors([ok(1), err('e1'), ok(2), err('e2')]);
        expect(out.isErr()).toBe(true);
        if (out.isErr()) {
            expect(out.error).toEqual(['e1', 'e2']);
        }
    });

    it('gibt Ok([]) bei leerem Input zurück', () => {
        const out = collectAllErrors<number, string>([]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([]);
        }
    });
});
