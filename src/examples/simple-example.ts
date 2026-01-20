import { err, ok, type Result } from '../index';

type ValidationError = {
    readonly code: string;
    readonly message: string;
};

function createValidationError(code: string, message: string): ValidationError {
    return Object.freeze({ code, message });
}

export const validateInputPayload = (input: unknown): Result<string, ValidationError> => {
    if (typeof input !== 'string' || input === null) {
        return err(createValidationError('INVALID_TYPE', 'Expected string type'));
    }
    if (input.length === 0) {
        return err(createValidationError('EMPTY_INPUT', 'Input string cannot be empty'));
    }
    return ok(input);
};

function decorateString(input: string): Result<string, ValidationError> {
    return ok(`${input} [DECORATED]`);
}

function processBasic(): Result<string, ValidationError> {
    const result = validateInputPayload('sample_input_data');
    return result;
}

function processWithErrorConversion(): Result<string, ValidationError> {
    const result = validateInputPayload('sample_input_data');
    if (result.isErr()) return result;
    return decorateString(result.value);
}

function calculateInputLength(): Result<number, ValidationError> {
    const result = validateInputPayload('input_payload');
    if (result.isErr()) return err(result.error);
    return ok(result.value.length);
}

async function main(): Promise<void> {
    console.log('=== Result Pattern Demo ===\n');

    const basicResult = processBasic();
    console.log('processBasic():', basicResult.isOk() ? `OK: "${basicResult.value}"` : `ERROR: ${basicResult.error.code}`);

    const decoratedResult = processWithErrorConversion();
    console.log(
        'processWithErrorConversion():',
        decoratedResult.isOk() ? `OK: "${decoratedResult.value}"` : `ERROR: ${decoratedResult.error.code}`
    );

    const lengthResult = calculateInputLength();
    console.log(
        'calculateInputLength():',
        lengthResult.isOk() ? `OK: ${lengthResult.value}` : `ERROR: ${lengthResult.error.code}`
    );

    console.log('\n=== Demo Complete ===');
}

main();
