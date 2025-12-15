import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { toPromise } from './toPromise';

describe('toPromise', () => {
    it('resolved bei Ok', async () => {
        await expect(toPromise(ok(42))).resolves.toBe(42);
    });

    it('rejects bei Err', async () => {
        await expect(toPromise(err('boom'))).rejects.toBe('boom');
    });
});

