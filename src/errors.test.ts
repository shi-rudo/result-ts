import { describe, expect, it } from 'vitest';

import {
    ERR_INVALID_RESULT_STATE,
    InvalidResultStateError,
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
});
