import { describe, expect, it } from 'vitest';

import { err, ok, type Result } from '../index';
import { all, sequence } from './sequence';

describe('sequence', () => {
    it('combines all Ok results', () => {
        const out = sequence([ok(1), ok(2), ok(3)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2, 3]);
        }
    });

    it('short-circuits on the first Err', () => {
        const firstErr = err('error1');
        const out = sequence([ok(1), firstErr, err('error2')]);
        expect(out).toBe(firstErr as unknown as Result<number[], string>);
    });

    it('returns Ok([]) for empty input', () => {
        const out = sequence([] as Array<Result<number, string>>);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([]);
        }
    });
});

describe('all', () => {
    it('is an alias for sequence', () => {
        const out = all([ok(1), ok(2)]);
        expect(out.isOk()).toBe(true);
        if (out.isOk()) {
            expect(out.value).toEqual([1, 2]);
        }
    });
});
