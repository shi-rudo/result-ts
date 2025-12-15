import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { containsErr } from './containsErr';

describe('containsErr', () => {
    it('gibt true bei Err mit passendem Fehler', () => {
        expect(containsErr(err('boom'), 'boom')).toBe(true);
    });

    it('gibt false bei Err mit anderem Fehler', () => {
        expect(containsErr(err('boom'), 'nope')).toBe(false);
    });

    it('gibt false bei Ok', () => {
        expect(containsErr(ok(42), 'boom')).toBe(false);
    });
});

