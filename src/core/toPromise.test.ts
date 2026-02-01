import { describe, expect, it } from 'vitest';

import { err, ok } from './result';
import { toPromise } from './toPromise';

describe('toPromise', () => {
    it('resolves on Ok', async () => {
        await expect(toPromise(ok(42))).resolves.toBe(42);
    });

    it('rejects on Err', async () => {
        await expect(toPromise(err('boom'))).rejects.toBe('boom');
    });
});

