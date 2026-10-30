import { describe, expect, it, vi } from 'vitest';

import { Result } from './result';
import { tryFn } from './try';

describe('tryFn', () => {
    it('returns Ok when function does not throw', () => {
        const result = tryFn(() => 42);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(42);
        }
    });

    it('returns Err when function throws', () => {
        const result = tryFn(() => {
            throw new Error('boom');
        });

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toBe('boom');
        }
    });

    it('maps the thrown error through errorMapper', () => {
        const result = Result.try(
            () => {
                throw new Error('boom');
            },
            error => ({ code: 'PARSE_FAILED' as const, cause: error })
        );

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.code).toBe('PARSE_FAILED');
            expect((result.error.cause as Error).message).toBe('boom');
        }
    });

    it('does not call errorMapper when the function returns', () => {
        const errorMapper = vi.fn(() => 'mapped');

        const result = Result.try(() => 42, errorMapper);

        expect(result.unwrap()).toBe(42);
        expect(errorMapper).not.toHaveBeenCalled();
    });

    it('rethrows an errorMapper failure as a programmer error', () => {
        const bug = new Error('mapper bug');

        expect(() => Result.try(() => { throw new Error('boom'); }, () => { throw bug; })).toThrow(bug);
    });
});
