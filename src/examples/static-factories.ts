/**
 * Examples of using static factory methods
 * 
 * Result offers multiple static factory methods for creating
 * Result instances from various sources.
 */

import { Result, flatMap, map, recover, tryFn } from '../index';

// ============================================================================
// 1. Result.try() - catch exceptions
// ============================================================================

console.log('\n=== Result.try() ===\n');

// JSON parsing with exception handling
const parseJson = (input: string) => Result.try(() => JSON.parse(input));

const validJson = parseJson('{"name": "Alice"}');
console.log('Valid JSON:', validJson.value); // { name: 'Alice' }

const invalidJson = parseJson('{invalid}');
console.log('Invalid JSON:', invalidJson.error); // SyntaxError

// Also for other throwing functions
const divide = (a: number, b: number) =>
    Result.try(() => {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
    });

console.log('10 / 2 =', divide(10, 2).value); // 5
console.log('10 / 0 =', divide(10, 0).error); // Error: Division by zero

// ============================================================================
// 2. Result.fromNullable() - convert nullable values
// ============================================================================

console.log('\n=== Result.fromNullable() ===\n');

interface User {
    id: number;
    name: string;
}

// Simulate a database query
const findUser = (id: number): User | undefined => {
    const db: Record<number, User> = {
        1: { id: 1, name: 'Alice' },
        2: { id: 2, name: 'Bob' },
    };
    return db[id] ?? undefined;
};

const user1 = Result.fromNullable(findUser(1), 'User not found');
console.log('User 1:', user1.value); // { id: 1, name: 'Alice' }

const user99 = Result.fromNullable(findUser(99), 'User not found');
console.log('User 99:', user99.error); // 'User not found'

// With undefined
const maybeValue: string | undefined = undefined;
const result = Result.fromNullable(maybeValue, 'Value is missing');
console.log('Undefined value:', result.error); // 'Value is missing'

// ============================================================================
// 3. Result.fromPromise() - async operations
// ============================================================================

console.log('\n=== Result.fromPromise() ===\n');

// Simulate API calls
const fetchUser = async (id: number): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (id === 1) return { id: 1, name: 'Alice' };
    throw new Error(`User ${id} not found`);
};

// Without error mapper
const asyncUser1 = await Result.fromPromise(fetchUser(1));
console.log('Async User 1:', asyncUser1.value); // { id: 1, name: 'Alice' }

const asyncUser99 = await Result.fromPromise(fetchUser(99));
console.log('Async User 99:', asyncUser99.error); // Error: User 99 not found

// With custom error mapper
const asyncUser2 = await Result.fromPromise(
    fetchUser(99),
    (error) => `Failed to fetch user: ${error}`
);
console.log('Mapped error:', asyncUser2.error); // 'Failed to fetch user: Error: User 99 not found'

// ============================================================================
// 4. Combine with pipe operators
// ============================================================================

console.log('\n=== Combine with operators ===\n');


// Try + map chain
const parseAndDouble = (input: string) =>
    Result.try(() => JSON.parse(input))
        .pipe(
            map((obj: any) => obj.value),
            map((n: number) => n * 2),
            recover(0) // Fallback on error
        );

console.log('Parse and double "{"value": 5}":', parseAndDouble('{"value": 5}').value); // 10
console.log('Parse and double "{invalid}":', parseAndDouble('{invalid}').value); // 0

// fromNullable + flatMap
const getUserEmail = (userId: number) =>
    Result.fromNullable(findUser(userId), 'User not found')
        .pipe(
            flatMap(user =>
                Result.fromNullable(
                    (user as any).email,
                    'Email not set'
                )
            )
        );

console.log('Get email for user 1:', getUserEmail(1).error); // 'Email not set'
console.log('Get email for user 99:', getUserEmail(99).error); // 'User not found'

// fromPromise + error recovery
const fetchWithFallback = async (id: number) =>
    (await Result.fromPromise(fetchUser(id)))
        .pipe(
            recover({ id: 0, name: 'Guest' })
        );

console.log('Fetch with fallback (1):', (await fetchWithFallback(1)).value); // { id: 1, name: 'Alice' }
console.log('Fetch with fallback (99):', (await fetchWithFallback(99)).value); // { id: 0, name: 'Guest' }

// ============================================================================
// 5. Real-World Example: Form Validation
// ============================================================================

console.log('\n=== Real-World: Form Validation ===\n');

interface FormData {
    email: string;
    age: string;
}

const validateEmail = (email: string) =>
    Result.try(() => {
        if (!email.includes('@')) throw new Error('Invalid email');
        return email;
    });

const validateAge = (age: string) =>
    Result.try(() => {
        const parsed = parseInt(age, 10);
        if (isNaN(parsed)) throw new Error('Age must be a number');
        if (parsed < 18) throw new Error('Must be 18 or older');
        return parsed;
    });

const validateForm = (data: FormData) => {
    const email = validateEmail(data.email);
    const age = validateAge(data.age);

    if (email.isErr()) return email;
    if (age.isErr()) return age;

    return Result.ok({ email: email.value, age: age.value });
};

console.log('Valid form:', validateForm({
    email: 'alice@example.com',
    age: '25'
}).value); // { email: 'alice@example.com', age: 25 }

console.log('Invalid email:', validateForm({
    email: 'invalid',
    age: '25'
}).error); // Error: Invalid email

console.log('Invalid age:', validateForm({
    email: 'alice@example.com',
    age: '15'
}).error); // Error: Must be 18 or older

// ============================================================================
// 6. Comparison: static methods vs. standalone functions
// ============================================================================

console.log('\n=== Static Methods vs. Standalone Functions ===\n');


// Both variants work the same:

// Static method (recommended)
const result1 = Result.try(() => JSON.parse('{"a": 1}'));

// Standalone function (for backward compatibility)
const result2 = tryFn(() => JSON.parse('{"a": 1}'));

console.log('Static method:', result1.value); // { a: 1 }
console.log('Standalone function:', result2.value); // { a: 1 }

// The static methods are more idiomatic and consistent with other languages
