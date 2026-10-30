import { describe, expect, it } from 'vitest';

import {
    ERR_INVALID_RESULT_STATE,
    ExpectErrError,
    ExpectOkError,
    InvalidResultStateError,
    UnwrapErrOnOkError,
    UnwrapOnErrError,
} from './errors';

describe('errors', () => {
    it('uses Result-specific code names for Result-specific errors', () => {
        const error = new InvalidResultStateError('test');

        expect(error.code).toBe(ERR_INVALID_RESULT_STATE);
    });

    it('reports a value that is neither Ok nor Err by default', () => {
        const error = new InvalidResultStateError('map');

        expect(error.message).toBe('ERR_INVALID_RESULT_STATE: Result is neither Ok nor Err (context: map)');
    });

    it('reports what the throw site observed and keeps the code', () => {
        const error = new InvalidResultStateError('sequenceRecord', 'received an array; use sequence() for a list');

        expect(error.code).toBe(ERR_INVALID_RESULT_STATE);
        expect(error.message).toBe('ERR_INVALID_RESULT_STATE: received an array; use sequence() for a list (context: sequenceRecord)');
    });

    it.each([
        ['UnwrapOnErrError', (payload: unknown) => new UnwrapOnErrError(payload)],
        ['ExpectOkError', (payload: unknown) => new ExpectOkError('must be ok', payload)],
    ])('%s carries the Err payload as a native cause', (_name, create) => {
        const payload = new Error('db down');

        const error = create(payload);

        expect(error.cause).toBe(payload);
        expect(Object.getOwnPropertyDescriptor(error, 'cause')?.enumerable).toBe(false);
    });

    it.each([
        ['UnwrapOnErrError', () => new UnwrapOnErrError(undefined)],
        ['ExpectOkError', () => new ExpectOkError('must be ok', undefined)],
    ])('%s sets no cause for an undefined Err payload', (_name, create) => {
        const error = create();

        expect(Object.hasOwn(error, 'cause')).toBe(false);
    });

    it.each([
        ['UnwrapErrOnOkError', (value: unknown) => new UnwrapErrOnOkError(value)],
        ['ExpectErrError', (value: unknown) => new ExpectErrError('must be err', value)],
    ])('%s sets no cause, because an Ok value is no error', (_name, create) => {
        const value = { id: 1 };

        const error = create(value);

        expect(Object.hasOwn(error, 'cause')).toBe(false);
    });
});
