import { describe, expect, it } from 'vitest';

import { Result, ok, err } from './result';
import { collectFirstOk } from './collectFirstOk';

describe('collectFirstOk', () => {
    it('returns first Ok Result', () => {
        const results = [err('error1'), err('error2'), ok(42), err('error3')];
        const collected = collectFirstOk(results);

        expect(collected.isOk()).toBe(true);
        if (collected.isOk()) {
            expect(collected.value).toBe(42);
        }
    });

    it('collects all Errors if no Ok is found', () => {
        const results = [err('error1'), err('error2'), err('error3')];
        const collected = collectFirstOk(results);

        expect(collected.isErr()).toBe(true);
        if (collected.isErr()) {
            expect(collected.error).toEqual(['error1', 'error2', 'error3']);
        }
    });

    it('returns empty Error array for empty Result array', () => {
        const results: Result<number, string>[] = [];
        const collected = collectFirstOk(results);

        expect(collected.isErr()).toBe(true);
        if (collected.isErr()) {
            expect(collected.error).toEqual([]);
        }
    });

    it('works with different types', () => {
        const results = [
            err('network error'),
            err('auth error'),
            ok({ user: 'alice', id: 123 }),
            err('db error')
        ];
        const collected = collectFirstOk(results);

        expect(collected.isOk()).toBe(true);
        if (collected.isOk()) {
            expect(collected.value).toEqual({ user: 'alice', id: 123 });
        }
    });

    it('stops at first Ok and collects previous Errors', () => {
        const results = [
            err('first error'),
            err('second error'),
            ok('success'),
            err('should not be collected')
        ];
        const collected = collectFirstOk(results);

        expect(collected.isOk()).toBe(true);
        if (collected.isOk()) {
            expect(collected.value).toBe('success');
        }
    });

    it('works with mixed Error types', () => {
        const results = [
            err('string error'),
            err(404),
            ok('found'),
            err(new Error('should not reach'))
        ];
        const collected = collectFirstOk(results);

        expect(collected.isOk()).toBe(true);
        if (collected.isOk()) {
            expect(collected.value).toBe('found');
        }
    });
});
