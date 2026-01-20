import { describe, expect, it } from 'vitest';

import { fold } from './fold';
import { err, ok } from './result';

describe('fold', () => {
    it('folds Ok value', () => {
        const out = ok(2).pipe(
            fold({
                ok: (value) => value * 2,
                err: () => -1,
            })
        );

        expect(out).toBe(4);
    });

    it('folds Err value', () => {
        const out = err('boom').pipe(
            fold({
                ok: () => 'ok',
                err: (error) => error,
            })
        );

        expect(out).toBe('boom');
    });
});
