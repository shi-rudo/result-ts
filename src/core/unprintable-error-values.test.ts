import { describe, expect, it } from 'vitest';

import {
    ERR_EXPECT_ERR,
    ERR_EXPECT_OK,
    ERR_UNWRAP_ERR_ON_OK,
    ERR_UNWRAP_ON_ERR,
    ExpectErrError,
    ExpectOkError,
    UnwrapErrOnOkError,
    UnwrapOnErrError,
} from '../errors';
import { err, ok } from './result';

const nullPrototype = (): object => Object.create(null) as object;

const throwingToString = (): object => ({
    toString(): string {
        throw new Error('toString is hostile');
    },
});

const throwingToStringTag = (): object => ({
    get [Symbol.toStringTag](): string {
        throw new Error('Symbol.toStringTag is hostile');
    },
    toString(): string {
        throw new Error('toString is hostile');
    },
});

const throwingMessageGetter = (): object => ({
    get message(): string {
        throw new Error('message getter is hostile');
    },
});

const throwingHasTrap = (): object => new Proxy({}, {
    has(): boolean {
        throw new Error('has trap is hostile');
    },
});

const caughtFrom = (run: () => unknown): unknown => {
    try {
        run();
    } catch (error) {
        return error;
    }
    return undefined;
};

// A payload that cannot be converted to a string must not replace the coded
// library error with the failure of its own converter.
describe('errors for values that cannot be converted to a string', () => {
    it('throws UnwrapOnErrError for an Err value with a null prototype', () => {
        const errorValue = nullPrototype();

        const caughtError = caughtFrom(() => err(errorValue).unwrap());

        expect(caughtError).toBeInstanceOf(UnwrapOnErrError);
        expect((caughtError as UnwrapOnErrError).code).toBe(ERR_UNWRAP_ON_ERR);
        expect((caughtError as UnwrapOnErrError).errorValue).toBe(errorValue);
    });

    it('throws UnwrapErrOnOkError for an Ok value whose toString throws', () => {
        const okValue = throwingToString();

        const caughtError = caughtFrom(() => ok(okValue).unwrapErr());

        expect(caughtError).toBeInstanceOf(UnwrapErrOnOkError);
        expect((caughtError as UnwrapErrOnOkError).code).toBe(ERR_UNWRAP_ERR_ON_OK);
        expect((caughtError as UnwrapErrOnOkError).okValue).toBe(okValue);
    });

    it('throws ExpectOkError for an Err value with a null prototype', () => {
        const errorValue = nullPrototype();

        const caughtError = caughtFrom(() => err(errorValue).expect('user must exist'));

        expect(caughtError).toBeInstanceOf(ExpectOkError);
        expect((caughtError as ExpectOkError).code).toBe(ERR_EXPECT_OK);
        expect((caughtError as ExpectOkError).message).toContain('user must exist');
    });

    it('throws ExpectErrError for an Ok value whose toString throws', () => {
        const okValue = throwingToString();

        const caughtError = caughtFrom(() => ok(okValue).expectErr('validation must fail'));

        expect(caughtError).toBeInstanceOf(ExpectErrError);
        expect((caughtError as ExpectErrError).code).toBe(ERR_EXPECT_ERR);
        expect((caughtError as ExpectErrError).message).toContain('validation must fail');
    });

    it('throws UnwrapOnErrError when the fallback description throws as well', () => {
        const errorValue = throwingToStringTag();

        const caughtError = caughtFrom(() => err(errorValue).unwrap());

        expect(caughtError).toBeInstanceOf(UnwrapOnErrError);
        expect((caughtError as UnwrapOnErrError).code).toBe(ERR_UNWRAP_ON_ERR);
        expect((caughtError as UnwrapOnErrError).message).toContain('[unprintable object]');
    });

    it('describes an unprintable error value in toUserFriendly', () => {
        expect(err(nullPrototype()).toUserFriendly()).toEqual({ isSuccess: false, error: '[object Object]' });
    });

    it('describes an error whose message getter throws in toUserFriendly', () => {
        expect(err(throwingMessageGetter()).toUserFriendly()).toEqual({ isSuccess: false, error: '[object Object]' });
    });

    it('describes an error whose has trap throws in toUserFriendly', () => {
        expect(err(throwingHasTrap()).toUserFriendly()).toEqual({ isSuccess: false, error: '[object Object]' });
    });

    it('describes an unprintable message property in toUserFriendly', () => {
        expect(err({ message: nullPrototype() }).toUserFriendly()).toEqual({ isSuccess: false, error: '[object Object]' });
    });
});
