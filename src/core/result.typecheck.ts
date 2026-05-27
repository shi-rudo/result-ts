import { err, ok, type Result } from '../index';

const okResult = ok<number, string>(42);
const errResult = err<string, number>('error');
const unionResult: Result<number, string> = Math.random() > 0.5 ? okResult : errResult;

if (okResult.isOk()) {
    const value: number = okResult.value;
    value satisfies number;
}

if (errResult.isErr()) {
    const error: string = errResult.error;
    error satisfies string;
}

// @ts-expect-error Ok results do not expose an impossible Err field.
okResult.error;

// @ts-expect-error Err results do not expose an impossible Ok field.
errResult.value;

// @ts-expect-error Result values must be narrowed before reading the Ok field.
unionResult.value;

// @ts-expect-error Result values must be narrowed before reading the Err field.
unionResult.error;
