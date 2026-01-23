export const ERR_INVALID_STATE = 'ERR_INVALID_STATE' as const;
export const ERR_TASK_YIELD_NOT_RESULT = 'ERR_TASK_YIELD_NOT_RESULT' as const;
export const ERR_MATCH_ON_OK = 'ERR_MATCH_ON_OK' as const;
export const ERR_UNWRAP_ON_ERR = 'ERR_UNWRAP_ON_ERR' as const;
export const ERR_UNWRAP_ERR_ON_OK = 'ERR_UNWRAP_ERR_ON_OK' as const;
export const ERR_EXPECT_OK = 'ERR_EXPECT_OK' as const;
export const ERR_EXPECT_ERR = 'ERR_EXPECT_ERR' as const;

export type ResultErrorCode =
    | typeof ERR_INVALID_STATE
    | typeof ERR_TASK_YIELD_NOT_RESULT
    | typeof ERR_MATCH_ON_OK
    | typeof ERR_UNWRAP_ON_ERR
    | typeof ERR_UNWRAP_ERR_ON_OK
    | typeof ERR_EXPECT_OK
    | typeof ERR_EXPECT_ERR;

const formatResultErrorMessage = (code: ResultErrorCode, message: string, context?: string): string => {
    if (context) {
        return `${code}: ${message} (context: ${context})`;
    }
    return `${code}: ${message}`;
};

export class ResultError extends Error {
    readonly code: ResultErrorCode;
    readonly context?: string;

    constructor(message: string, code: ResultErrorCode, context?: string) {
        super(formatResultErrorMessage(code, message, context));
        this.code = code;
        this.context = context;
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ResultTypeError extends TypeError {
    readonly code: ResultErrorCode;
    readonly context?: string;

    constructor(message: string, code: ResultErrorCode, context?: string) {
        super(formatResultErrorMessage(code, message, context));
        this.code = code;
        this.context = context;
        this.name = new.target.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

const INVALID_RESULT_STATE_MESSAGE = 'Unreachable: Result is neither Ok nor Err';

export class InvalidResultStateError extends ResultError {
    constructor(context?: string) {
        super(INVALID_RESULT_STATE_MESSAGE, ERR_INVALID_STATE, context);
    }
}

export class TaskYieldNotResultError extends ResultTypeError {
    readonly yieldedValue: unknown;

    constructor(yieldedValue: unknown) {
        super('task() expected yielded values to be Result. Use `yield*` on a Result.', ERR_TASK_YIELD_NOT_RESULT);
        this.yieldedValue = yieldedValue;
    }
}

export class MatchOnOkError extends ResultTypeError {
    constructor() {
        super('match() can only be called on Err results. Use `if (result.isErr()) { ... }` first.', ERR_MATCH_ON_OK);
    }
}

export class UnwrapOnErrError extends ResultTypeError {
    readonly errorValue: unknown;

    constructor(errorValue: unknown) {
        super(`Called unwrap() on Err: ${String(errorValue)}`, ERR_UNWRAP_ON_ERR);
        this.errorValue = errorValue;
    }
}

export class UnwrapErrOnOkError extends ResultTypeError {
    readonly okValue: unknown;

    constructor(okValue: unknown) {
        super(`Called unwrapErr() on Ok: ${String(okValue)}`, ERR_UNWRAP_ERR_ON_OK);
        this.okValue = okValue;
    }
}

export class ExpectOkError extends ResultError {
    readonly expectedMessage: string;

    constructor(expectedMessage: string) {
        super(expectedMessage, ERR_EXPECT_OK);
        this.expectedMessage = expectedMessage;
    }
}

export class ExpectErrError extends ResultError {
    readonly expectedMessage: string;

    constructor(expectedMessage: string) {
        super(expectedMessage, ERR_EXPECT_ERR);
        this.expectedMessage = expectedMessage;
    }
}
