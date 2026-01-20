/**
 * Examples for recover and recoverWith
 * 
 * recover: turns errors into a default value
 * recoverWith: like recover, but the default value is derived from the error
 */

import { err, map, ok, recover, recoverWith, type Result } from '../index';

// ============================================================================
// Example 1: Simple fallback with recover
// ============================================================================

function getUserAge(userId: string): Result<number, string> {
    if (userId === 'invalid') {
        return err('User not found');
    }
    return ok(25);
}

// When the user is not found, use 18 as the default age
const age1 = getUserAge('invalid').pipe(recover(18));
console.log('Age with fallback:', age1.unwrapOr(0)); // 18

const age2 = getUserAge('valid-id').pipe(recover(18));
console.log('Age without fallback:', age2.unwrapOr(0)); // 25

// ============================================================================
// Example 2: Error-based fallback with recoverWith
// ============================================================================

type ApiError = { code: number; message: string };

function fetchUserData(id: string): Result<{ name: string; score: number }, ApiError> {
    if (id === 'timeout') {
        return err({ code: 408, message: 'Request Timeout' });
    }
    if (id === 'not-found') {
        return err({ code: 404, message: 'Not Found' });
    }
    return ok({ name: 'Alice', score: 100 });
}

// Different fallback values depending on the error code
const userData = fetchUserData('timeout').pipe(
    recoverWith((error) => {
        if (error.code === 408) {
            return { name: 'Guest', score: 0 }; // Timeout → Guest User
        }
        if (error.code === 404) {
            return { name: 'Unknown', score: -1 }; // Not Found → Unknown
        }
        return { name: 'Error', score: -999 };
    })
);

console.log('User Data:', userData.unwrapOr({ name: 'Fallback', score: 0 }));

// ============================================================================
// Example 3: Error logging with recoverWith
// ============================================================================

function parseConfig(json: string): Result<{ port: number }, string> {
    try {
        const config = JSON.parse(json);
        if (typeof config.port !== 'number') {
            return err('Port is not a number');
        }
        return ok(config);
    } catch {
        return err('Invalid JSON');
    }
}

// Log the error and use a default config
const config = parseConfig('invalid json').pipe(
    recoverWith((error) => {
        console.error('Config error:', error);
        return { port: 3000 }; // Default port
    })
);

console.log('Port:', config.unwrapOr({ port: 8080 }).port); // 3000

// ============================================================================
// Example 4: Chaining with other operators
// ============================================================================


function divide(a: number, b: number): Result<number, string> {
    if (b === 0) return err('Division by zero');
    return ok(a / b);
}

// Recover from errors and then continue processing
const result = divide(10, 0)
    .pipe(recover(1)) // On error: use 1
    .pipe(map((x) => x * 2)) // Double
    .pipe(map((x) => `Result: ${x}`));

console.log(result.unwrapOr('Error')); // "Result: 2"

// ============================================================================
// Example 5: Different types for fallback
// ============================================================================

function getDiscount(code: string): Result<number, string> {
    if (code === 'SAVE20') return ok(20);
    return err('Invalid code');
}

// Fallback can be a different type (here: string instead of number)
const discount = getDiscount('INVALID').pipe(recover('No discount'));

// Type is now: Result<number | string, never>
console.log('Discount:', discount.unwrapOr('Error')); // "No discount"
