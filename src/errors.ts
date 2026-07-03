export const ERR_INVALID_RESULT_STATE = 'ERR_INVALID_RESULT_STATE' as const;
/** @deprecated Use {@link ERR_INVALID_RESULT_STATE} instead. */
export const ERR_INVALID_STATE: typeof ERR_INVALID_RESULT_STATE = ERR_INVALID_RESULT_STATE;
export const ERR_TASK_YIELD_NOT_RESULT = 'ERR_TASK_YIELD_NOT_RESULT' as const;
export const ERR_MATCH_ON_OK = 'ERR_MATCH_ON_OK' as const;
export const ERR_MATCH_ERR_HANDLER_NOT_RESULT = 'ERR_MATCH_ERR_HANDLER_NOT_RESULT' as const;
export const ERR_MATCH_TAG_MISSING_HANDLER = 'ERR_MATCH_TAG_MISSING_HANDLER' as const;
export const ERR_UNWRAP_ON_ERR = 'ERR_UNWRAP_ON_ERR' as const;
export const ERR_UNWRAP_ERR_ON_OK = 'ERR_UNWRAP_ERR_ON_OK' as const;
export const ERR_EXPECT_OK = 'ERR_EXPECT_OK' as const;
export const ERR_EXPECT_ERR = 'ERR_EXPECT_ERR' as const;

export type ResultErrorCode =
    | typeof ERR_INVALID_RESULT_STATE
    | typeof ERR_TASK_YIELD_NOT_RESULT
    | typeof ERR_MATCH_ON_OK
    | typeof ERR_MATCH_ERR_HANDLER_NOT_RESULT
    | typeof ERR_MATCH_TAG_MISSING_HANDLER
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
        super(INVALID_RESULT_STATE_MESSAGE, ERR_INVALID_RESULT_STATE, context);
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
    constructor(methodName = 'match') {
        super(`${methodName}() can only be called on Err results. Use \`if (result.isErr()) { ... }\` first.`, ERR_MATCH_ON_OK);
    }
}

export class MatchErrHandlerNotResultError extends ResultTypeError {
    readonly handlerName: string;
    readonly returnedValue: unknown;

    constructor(handlerName: string, returnedValue: unknown) {
        super(`matchErr().${handlerName}() handlers must return a Result. Wrap values with ok(...) or err(...).`, ERR_MATCH_ERR_HANDLER_NOT_RESULT);
        this.handlerName = handlerName;
        this.returnedValue = returnedValue;
    }
}

export class MatchTagMissingHandlerError extends ResultTypeError {
    readonly tagValue: unknown;

    constructor(tagValue: unknown) {
        super(`matchTag() has no handler for tag "${String(tagValue)}".`, ERR_MATCH_TAG_MISSING_HANDLER);
        this.tagValue = tagValue;
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
    readonly errorValue: unknown;

    constructor(expectedMessage: string, errorValue?: unknown) {
        super(errorValue === undefined ? expectedMessage : `${expectedMessage}: ${String(errorValue)}`, ERR_EXPECT_OK);
        this.expectedMessage = expectedMessage;
        this.errorValue = errorValue;
        if (errorValue !== undefined) this.cause = errorValue;
    }
}

export class ExpectErrError extends ResultError {
    readonly expectedMessage: string;
    readonly okValue: unknown;

    constructor(expectedMessage: string, okValue?: unknown) {
        super(okValue === undefined ? expectedMessage : `${expectedMessage}: ${String(okValue)}`, ERR_EXPECT_ERR);
        this.expectedMessage = expectedMessage;
        this.okValue = okValue;
        if (okValue !== undefined) this.cause = okValue;
    }
}
