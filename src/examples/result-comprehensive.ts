/**
 * Comprehensive examples for the Result monad
 * 
 * This file demonstrates all important features and patterns
 * for working with Result<T, E>.
 */

import { Result, ok, err, okIf, okIfLazy } from '../result';
import { task } from '../gen';
import { map } from '../operators/map';
import { mapErr } from '../operators/mapErr';
import { flatMap } from '../operators/flatMap';
import { filter } from '../operators/filter';
import { tap } from '../operators/tap';
import { recover, recoverWith } from '../operators/recover';
import { tryCatch } from '../operators/tryCatch';
import { tryMap } from '../operators/tryMap';
import { mapAsync } from '../operators-async/mapAsync';
import { flatMapAsync } from '../operators-async/flatMapAsync';
import { tryCatchAsync } from '../operators-async/tryCatchAsync';
import { fromPromise } from '../conversions/fromPromise';
import { fromNullable } from '../conversions/fromNullable';
import { toPromise } from '../conversions/toPromise';
import { sequence } from '../collections/sequence';
import { collectFirstOk } from '../collections/collectFirstOk';
import { zip } from '../combinators/zip';

// =============================================================================
// 1. BASICS: create Result
// =============================================================================

console.log('=== 1. BASICS ===\n');

// Simple Ok/Err construction
const success: Result<number, string> = ok(42);
const failure: Result<number, string> = err('Something went wrong');

console.log('Success:', success.isOk()); // true
console.log('Failure:', failure.isErr()); // true

// Conditional Result creation with okIf
const validateAge = (age: number): Result<number, string> => {
    return okIf(age >= 18, age, 'Must be 18 or older');
};

console.log('Age 25:', validateAge(25).isOk()); // true
console.log('Age 15:', validateAge(15).isErr()); // true

// Lazy evaluation for expensive computations
const expensiveValidation = (value: number): Result<string, string> => {
    return okIfLazy(
        value > 0,
        () => {
            console.log('  Computing expensive success value...');
            return `Valid: ${value * 1000}`;
        },
        () => 'Value must be positive'
    );
};

console.log('Expensive (positive):', expensiveValidation(5).isOk());
console.log('Expensive (negative):', expensiveValidation(-5).isErr()); // no computation!

// =============================================================================
// 2. TRANSFORMATIONS: map, mapErr, flatMap
// =============================================================================

console.log('\n=== 2. TRANSFORMATIONS ===\n');

// map: transforms the Ok value
const doubled = ok(21).pipe(
    map((n) => n * 2)
);
console.log('Doubled:', doubled.value); // 42

// mapErr: transforms the Err value
const betterError = err('db_error').pipe(
    mapErr((e) => `Database Error: ${e}`)
);
console.log('Better error:', betterError.error);

// flatMap: chains operations that return Result
const divide = (a: number, b: number): Result<number, string> => {
    return okIf(b !== 0, a / b, 'Division by zero');
};

const calculation = ok(100).pipe(
    flatMap((n) => divide(n, 2)),  // 50
    flatMap((n) => divide(n, 5)),  // 10
    map((n) => n + 2)               // 12
);
console.log('Calculation result:', calculation.value); // 12

// =============================================================================
// 3. VALIDATION: filter, tryMap
// =============================================================================

console.log('\n=== 3. VALIDATION ===\n');

// filter: converts Ok to Err when the condition fails
const validatePositive = ok(42).pipe(
    filter((n) => n > 0, () => 'Must be positive')
);
console.log('Positive validation:', validatePositive.isOk());

const validateNegative = ok(42).pipe(
    filter((n) => n < 0, () => 'Must be negative')
);
console.log('Negative validation:', validateNegative.isErr());

// tryMap: catches exceptions in map functions
const parseNumber = (str: string): Result<number, unknown> => {
    return ok(str).pipe(
        tryMap((s) => {
            const num = JSON.parse(s);
            if (typeof num !== 'number') throw new Error('Not a number');
            return num;
        })
    );
};

console.log('Parse "42":', parseNumber('42').isOk());
console.log('Parse "invalid":', parseNumber('invalid').isErr());

// =============================================================================
// 4. ERROR HANDLING: recover, recoverWith, tryCatch
// =============================================================================

console.log('\n=== 4. ERROR HANDLING ===\n');

// recover: provides a default value on Err
const withDefault = err('error').pipe(
    recover(0)
);
console.log('Recovered value:', withDefault.value); // 0

// recoverWith: provides an alternative Result
const withFallback = err('primary failed').pipe(
    recoverWith((_error: string) => 42)
);
console.log('Fallback value:', withFallback.value); // 42

// tryCatch: runs a function and catches exceptions
const riskyOperation = ok(null).pipe(
    tryCatch(
        () => {
            // Simulate a risky operation
            if (Math.random() > 0.5) throw new Error('Random failure');
            return 'Success!';
        },
        (error) => `Caught: ${(error as Error).message}`
    )
);
console.log('Risky operation:', riskyOperation.isOk() ? 'succeeded' : 'failed');

// =============================================================================
// 5. SIDE EFFECTS: tap
// =============================================================================

console.log('\n=== 5. SIDE EFFECTS ===\n');

// tap: runs side effects without changing the value
const withLogging = ok(42).pipe(
    tap({ ok: (n) => console.log(`  Processing: ${n}`) }),
    map((n) => n * 2),
    tap({ ok: (n) => console.log(`  After doubling: ${n}`) })
);
console.log('Final value:', withLogging.value);

// =============================================================================
// 6. ASYNC OPERATIONS
// =============================================================================

console.log('\n=== 6. ASYNC OPERATIONS ===\n');

// fromPromise: converts Promise to Result
async function fetchUser(id: number): Promise<Result<{ name: string; id: number }, unknown>> {
    return fromPromise(
        fetch(`https://api.example.com/users/${id}`)
            .then((res) => res.json())
            .then((data: any) => ({ name: data.name, id }))
    );
}

// mapAsync: async transformation
async function processAsync() {
    const result = await ok(5).pipeAsync(
        mapAsync(async (n) => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return n * 2;
        })
    );
    console.log('Async mapped:', result.value);
}

// flatMapAsync: async chaining
async function validateUserAsync(id: number): Promise<Result<string, string>> {
    return ok(id).pipeAsync(
        flatMapAsync(async (userId) => {
            // Simulate an API call
            await new Promise((resolve) => setTimeout(resolve, 50));
            return okIf(userId > 0, `User ${userId}`, 'Invalid user ID');
        }),
        flatMapAsync(async (userName) => {
            // Simulate further validation
            await new Promise((resolve) => setTimeout(resolve, 50));
            return okIf(userName.length > 0, userName.toUpperCase(), 'Empty name');
        })
    );
}

// tryCatchAsync: Async Exception Handling
async function riskyAsyncOperation(): Promise<Result<string, string>> {
    return ok(null).pipeAsync(
        tryCatchAsync(
            async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                if (Math.random() > 0.5) throw new Error('Async failure');
                return 'Async success!';
            },
            (error) => `Async error: ${(error as Error).message}`
        )
    );
}

processAsync().catch(console.error);
validateUserAsync(42).then((r) => {
    if (r.isOk()) console.log('User validation:', r.value);
}).catch(console.error);
riskyAsyncOperation().then((r) => console.log('Risky async:', r.isOk() ? 'OK' : 'ERR')).catch(console.error);

// =============================================================================
// 7. COLLECTIONS: sequence, zip, collectFirstOk
// =============================================================================

console.log('\n=== 7. COLLECTIONS ===\n');

// sequence: converts Array<Result> to Result<Array>
const results = [ok(1), ok(2), ok(3)];
const sequenced = sequence(results);
console.log('Sequenced:', sequenced.value); // [1, 2, 3]

const withError = [ok(1), err('error'), ok(3)];
const sequencedWithError = sequence(withError);
console.log('Sequenced with error:', sequencedWithError.isErr()); // true

// zip: combines multiple Results
const combined = zip(ok(1), ok('hello'));
console.log('Zipped:', combined.value); // [1, 'hello']

// collectFirstOk: finds the first Ok Result
const firstOk = collectFirstOk([
    err('first error'),
    err('second error'),
    ok(42),
    ok(100),
]);
console.log('First OK:', firstOk.value); // 42

// =============================================================================
// 8. CONVERSIONS: fromNullable, toPromise
// =============================================================================

console.log('\n=== 8. CONVERSIONS ===\n');

// fromNullable: converts nullable values
const maybeValue: string | null = 'hello';
const resultFromNullable = fromNullable(maybeValue, 'Value was null');
console.log('From nullable:', resultFromNullable.value);

const nullValue: string | null = null;
const resultFromNull = fromNullable(nullValue, 'Value was null');
console.log('From null:', resultFromNull.error);

// toPromise: converts Result to Promise
async function resultToPromiseExample() {
    try {
        const value = await toPromise(ok(42));
        console.log('Promise from Ok:', value);
    } catch (error) {
        console.log('This should not happen');
    }

    try {
        await toPromise(err('error'));
    } catch (error) {
        console.log('Promise from Err caught:', error);
    }
}

resultToPromiseExample();

// =============================================================================
// 9. DO-NOTATION: generator-based syntax
// =============================================================================

console.log('\n=== 9. DO-NOTATION ===\n');

// task: generator-based error handling (similar to Haskell's do-notation)
function validateEmail(email: string): Result<string, string> {
    return okIf(email.includes('@'), email, 'Invalid email');
}

function validatePassword(password: string): Result<string, string> {
    return okIf(password.length >= 8, password, 'Password too short');
}

function createUserFromEmail(email: string, _password: string): Result<{ name: string; email: string }, string> {
    const name: string = email.split('@')[0] || '';
    return ok({ name, email });
}

// Successful registration
const userRegistration = validateEmail('user@example.com').pipe(
    flatMap((email) => validatePassword('securePass123').pipe(
        flatMap((password) => createUserFromEmail(email, password))
    )),
    map((user) => `User created: ${user.name}`)
);

if (userRegistration.isOk()) {
    console.log('User registration:', userRegistration.value);
}

// Failure case
const failedRegistration = validateEmail('invalid-email').pipe(
    flatMap((email) => validatePassword('securePass123').pipe(
        flatMap((password) => createUserFromEmail(email, password))
    )),
    map((user) => `User created: ${user.name}`)
);

if (failedRegistration.isErr()) {
    console.log('Failed registration:', failedRegistration.error);
}

// =============================================================================
// 10. PATTERN MATCHING
// =============================================================================

console.log('\n=== 10. PATTERN MATCHING ===\n');

// pattern(): universal matcher for Ok + Err
const patternResult = ok<number, string>(42);

if (patternResult.isOk()) {
    console.log('Pattern match:', `Success: ${patternResult.value}`);
} else {
    console.log('Pattern match:', `Error: ${patternResult.error}`);
}

// Error-specific matching
const errorResult2 = err<string, string>('not_found');

if (errorResult2.isErr()) {
    const e = errorResult2.error;
    const handled = e === 'not_found' ? 'Resource not found'
        : e === 'unauthorized' ? 'Access denied'
            : 'Unknown error';
    console.log('Error handled:', handled);
}

// =============================================================================
// 11. REAL-WORLD EXAMPLE: User API
// =============================================================================

console.log('\n=== 11. REAL-WORLD EXAMPLE ===\n');

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

type ValidationError =
    | 'INVALID_EMAIL'
    | 'INVALID_AGE'
    | 'INVALID_NAME'
    | 'USER_EXISTS';

class UserService {
    private users: User[] = [];

    validateEmail(email: string | undefined): Result<string, ValidationError> {
        return fromNullable(email, 'INVALID_EMAIL' as ValidationError).pipe(
            filter((e) => e.includes('@'), () => 'INVALID_EMAIL' as ValidationError)
        );
    }

    validateName(name: string | undefined): Result<string, ValidationError> {
        return fromNullable(name, 'INVALID_NAME' as ValidationError).pipe(
            filter((n) => n.length >= 2, () => 'INVALID_NAME' as ValidationError)
        );
    }

    validateAge(age: number | undefined): Result<number, ValidationError> {
        return fromNullable(age, 'INVALID_AGE' as ValidationError).pipe(
            filter((a) => a >= 18 && a <= 120, () => 'INVALID_AGE' as ValidationError)
        );
    }

    validateUser(data: Partial<User>): Result<User, ValidationError> {
        const emailResult = fromNullable(data.email, 'INVALID_EMAIL' as ValidationError).pipe(
            filter((e) => e.includes('@'), () => 'INVALID_EMAIL' as ValidationError)
        );
        if (emailResult.isErr()) return err(emailResult.error);

        const nameResult = fromNullable(data.name, 'INVALID_NAME' as ValidationError).pipe(
            filter((n) => n.length >= 2, () => 'INVALID_NAME' as ValidationError)
        );
        if (nameResult.isErr()) return err(nameResult.error);

        const ageResult = fromNullable(data.age, 'INVALID_AGE' as ValidationError).pipe(
            filter((a) => a >= 18 && a <= 120, () => 'INVALID_AGE' as ValidationError)
        );
        if (ageResult.isErr()) return err(ageResult.error);

        const user: User = {
            id: data.id ?? Math.floor(Math.random() * 1000),
            name: nameResult.value!,
            email: emailResult.value!,
            age: ageResult.value!,
        };
        return ok(user);
    }

    createUser(data: Partial<User>) {
        return this.validateUser(data).pipe(
            flatMap((user): Result<User, ValidationError> => {
                const exists = this.users.some((u) => u.email === user.email);
                return okIf(!exists, user, 'USER_EXISTS' as ValidationError);
            }),
            tap({
                ok: (user: User) => {
                    this.users.push(user);
                    console.log(`  ✓ User created: ${user.name}`);
                }
            })
        );
    }

    getUser(id: number): Result<User, string> {
        const user = this.users.find((u) => u.id === id);
        return fromNullable(user, 'User not found');
    }
}

// Usage
const service = new UserService();

const validUser = service.createUser({
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
});

console.log('Valid user created:', validUser.isOk());

const invalidUser = service.createUser({
    name: 'B', // too short
    email: 'invalid',
    age: 15, // too young
});

if (invalidUser.isErr()) {
    console.log('Invalid user error:', invalidUser.error);
}

// =============================================================================
// 12. CHAINING & COMPOSITION
// =============================================================================

console.log('\n=== 12. CHAINING & COMPOSITION ===\n');

// Complex pipeline
const processData = (input: string) => {
    return ok(input).pipe(
        // Validation
        filter((s) => s.length > 0, () => 'Input cannot be empty'),

        // Transformation
        map((s) => s.trim().toLowerCase()),

        // Parsing with error handling
        tryMap((s) => {
            const num = parseInt(s, 10);
            if (isNaN(num)) throw new Error('Not a number');
            return num;
        }),

        // Business logic
        flatMap((n) => okIf(n >= 0, n, 'Number must be non-negative')),

        // Further transformation
        map((n) => n * 2),

        // Logging
        tap({ ok: (n) => console.log(`  Processed value: ${n}`) }),

        // Error recovery
        recover(0)
    );
};

const result42 = processData('42');
if (result42.isOk()) console.log('Process "42":', result42.value);

const resultInvalid = processData('invalid');
if (resultInvalid.isOk()) console.log('Process "invalid":', resultInvalid.value);

const resultNeg = processData('-5');
if (resultNeg.isOk()) console.log('Process "-5":', resultNeg.value);

// =============================================================================
// 13. BEST PRACTICES
// =============================================================================

console.log('\n=== 13. BEST PRACTICES ===\n');

// ✓ DO: Use okIf for conditional Results
const good1 = (age: number) => okIf(age >= 18, age, 'Too young');

// ✗ DON'T: Manual type annotations
// const bad1 = (age: number): Result<number, string> => 
//     age >= 18 ? ok(age) : err('Too young');

// ✓ DO: Use task() for complex validations
const good2 = task(function* () {
    const a = yield* validateStep1();
    const b = yield* validateStep2(a);
    return b;
});

function validateStep1(): Result<number, string> { return ok(1); }
function validateStep2(n: number): Result<string, string> { return ok(`${n}`); }

// ✓ DO: Use flatMap for chained operations
const good3 = ok(10).pipe(
    flatMap((n) => divide(n, 2)),
    flatMap((n) => divide(n, 5))
);

// ✗ DON'T: Nested if checks
// const bad3 = ok(10);
// if (bad3.isOk()) {
//     const step1 = divide(bad3.value, 2);
//     if (step1.isOk()) {
//         const step2 = divide(step1.value, 5);
//         // ...
//     }
// }

// ✓ DO: Use isOk/isErr for error handling
if (patternResult.isOk()) {
    console.log(`Success: ${patternResult.value}`);
}

console.log('Best practices demonstrated ✓');

// =============================================================================
// END
// =============================================================================

console.log('\n=== All examples completed! ===\n');
