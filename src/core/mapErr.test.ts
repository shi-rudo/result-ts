import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { mapErr } from './mapErr';

describe('mapErr', () => {
    it('lässt Ok unverändert', () => {
        const result = ok(42);
        const mapped = result.pipe(mapErr(e => `mapped: ${e}`));
        expect(mapped.isOk()).toBe(true);
        if (mapped.isOk()) {
            expect(mapped.value).toBe(42);
        }
    });

    it('transformiert Err-Wert', () => {
        const result = err('original error');
        const mapped = result.pipe(mapErr(e => `mapped: ${e}`));
        expect(mapped.isErr()).toBe(true);
        if (mapped.isErr()) {
            expect(mapped.error).toBe('mapped: original error');
        }
    });
});
