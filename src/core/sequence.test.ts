import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from './result';
import { all, sequence } from './sequence';

describe('sequence', () => {
    it('kombiniert alle Ok results', () => {
        const out = sequence([ok(1), ok(2), ok(3)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2, 3]);
        }
    });

    it('short-circuits beim ersten Err', () => {
        const firstErr = err('error1');
        const out = sequence([ok(1), firstErr, err('error2')]);
        expect(out).toBe(firstErr as unknown as Result<number[], string>);
    });

    it('gibt Ok([]) bei leerem Input zurück', () => {
        const out = sequence<number, string>([]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([]);
        }
    });
});

describe('all', () => {
    it('ist ein Alias für sequence', () => {
        const out = all([ok(1), ok(2)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2]);
        }
    });
});
