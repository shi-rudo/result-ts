import { describe, expect, it } from 'vitest';

import {
    ERR_INVALID_RESULT_STATE,
    ERR_INVALID_STATE,
    InvalidResultStateError,
} from './errors';

describe('errors', () => {
    it('uses Result-specific code names for Result-specific errors', () => {
        const error = new InvalidResultStateError('test');

        expect(error.code).toBe(ERR_INVALID_RESULT_STATE);
        expect(ERR_INVALID_STATE).toBe(ERR_INVALID_RESULT_STATE);
    });
});
