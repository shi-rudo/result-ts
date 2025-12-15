import { describe, expect, it } from 'vitest';

import { Result, ok } from './result';
import { partition } from './partition';

describe('partition', () => {
    it('teilt Results in Ok-Werte und Err-Fehler', () => {
        const [oks, errs] = partition([ok(1), Result.err('e1'), ok(2), Result.err('e2')] as const);

        const _okType: number[] = oks;
        const _errType: string[] = errs;

        expect(oks).toEqual([1, 2]);
        expect(errs).toEqual(['e1', 'e2']);
    });
});

