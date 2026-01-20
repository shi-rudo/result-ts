import { Result, ok, err, isOk, isErr } from '../index';

type DomainError =
    | { kind: 'NotFound'; id: string }
    | { kind: 'Validation'; field: string; message: string }
    | { kind: 'IO'; message: string; cause?: unknown };

type User = { id: string; email: string };

// Pattern 1: Result.* static methods - good for async functions, explicit Result namespace
async function loadUser(id: string): Promise<Result<User, DomainError>> {
    if (!id) return Result.err({ kind: 'Validation', field: 'id', message: 'missing' });
    if (id === '404') return Result.err({ kind: 'NotFound', id });
    return Result.ok({ id, email: 'a@b.c' });
}

// Pattern 2: Standalone ok/err functions - concise, good for sync functions
function parseEmail(email: string): Result<string, DomainError> {
    if (!email.includes('@')) {
        return err({ kind: 'Validation', field: 'email', message: 'invalid' });
    }
    return ok(email.toLowerCase());
}

// Pattern 3: Mixed usage - combines early returns with Result.try() for exception handling
// - err(): standalone for early validation errors
// - Result.try(): static method for try/catch wrapper
// - ok(): standalone for success case
function validateUserInput(input: unknown): Result<{ raw: string; parsed: object }, DomainError> {
    if (!input) return err({ kind: 'Validation', field: 'input', message: 'missing' });
    if (typeof input !== 'string') return err({ kind: 'Validation', field: 'input', message: 'must be string' });

    const jsonRes = Result.try(() => JSON.parse(input));
    if (jsonRes.isErr()) return Result.err({ kind: 'Validation', field: 'input', message: 'invalid JSON' });

    return ok({ raw: input, parsed: jsonRes.value });
}

// Caller for validateUserInput - demonstrates consuming the Result
async function processInput(data: unknown): Promise<Result<string, DomainError>> {
    const validated = validateUserInput(data);
    if (validated.isErr()) return Result.err(validated.error);

    return ok(`Parsed: ${JSON.stringify(validated.value.parsed)}`);
}

// Also uses Result.* (async function consistency)
async function sendWelcome(email: string): Promise<Result<void, DomainError>> {
    if (email.endsWith('@b.c')) {
        return Result.err({ kind: 'IO', message: 'smtp failed', cause: 'ECONNRESET' });
    }
    return Result.ok();
}

// Go-like: explicit checks + early return
export async function onboardUser(id: string): Promise<Result<void, DomainError>> {
    const userRes = await loadUser(id);
    if (userRes.isErr()) return userRes;

    // Using the utils function isErr
    const emailRes = parseEmail(userRes.value.email);
    if (isErr(emailRes)) return emailRes;

    // Using the class method isErr
    const sendRes = await sendWelcome(emailRes.value);
    if (sendRes.isErr()) return sendRes;

    return ok();
}

// Demonstrating isOk() variants
async function checkUserStatus(id: string): Promise<Result<string, DomainError>> {
    const userRes = await loadUser(id);

    // Using the class method isOk (type guard)
    if (userRes.isOk()) {
        return Result.ok(`User ${userRes.value.id} loaded`);
    }

    // Using the utils function isOk (pure function alternative)
    if (isOk<User, DomainError>(userRes)) {
        return Result.ok('user exists');
    }

    return userRes;
}

// Caller: Fehler-Handling zentral
async function run() {
    const res = await onboardUser('404');

    if (res.isOk()) {
        console.log('done');
        return;
    }

    const e = res.error;
    switch (e.kind) {
        case 'NotFound':
            console.error('user missing:', e.id);
            return;
        case 'Validation':
            console.error('bad input:', e.field, e.message);
            return;
        case 'IO':
            console.error('infra:', e.message, e.cause);
            return;
    }
}
