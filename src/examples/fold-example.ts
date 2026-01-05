import { Result, ok, err } from '../index';

// Example 1: Simple fold with string output
function processNumber(value: number): Result<number, string> {
    if (value < 0) {
        return err('Negative numbers are not allowed');
    }
    return ok(value * 2);
}

const result1 = processNumber(42);
const message1 = result1.fold(
    val => `Success: ${val}`,
    err => `Error: ${err}`
);
console.log(message1); // "Success: 84"

const result2 = processNumber(-5);
const message2 = result2.fold(
    val => `Success: ${val}`,
    err => `Error: ${err}`
);
console.log(message2); // "Error: Negative numbers are not allowed"

// Example 2: Fold with side effects (like console.log)
const result3 = processNumber(10);
result3.fold(
    val => console.log("Yay:", val),
    err => console.error("Nay:", err)
);

// Example 3: Fold to convert to HTTP response
type HttpResponse = {
    status: number;
    body: unknown;
};

function toHttpResponse<T, E>(result: Result<T, E>): HttpResponse {
    return result.fold(
        data => ({ status: 200, body: data as unknown }),
        error => ({ status: 500, body: { error: String(error) } as unknown })
    );
}

const apiResult = processNumber(100);
const response = toHttpResponse(apiResult);
console.log(response); // { status: 200, body: 200 }

// Example 4: Fold with complex types
type User = { id: number; name: string };
type UserError = { code: number; message: string };

function getUser(id: number): Result<User, UserError> {
    if (id === 1) {
        return ok({ id: 1, name: 'Alice' });
    }
    return err({ code: 404, message: 'User not found' });
}

const userResult = getUser(1);
const userDisplay = userResult.fold(
    user => `User: ${user.name} (ID: ${user.id})`,
    error => `Error ${error.code}: ${error.message}`
);
console.log(userDisplay); // "User: Alice (ID: 1)"

// Example 5: Fold method vs fold pipe operator
import { fold } from '../operators/fold';

// Using fold (direct method)
const foldMethodResult = result1.fold(
    val => val + 10,
    () => 0
);

// Using fold (pipe operator) - functionally equivalent
const foldPipeResult = result1.pipe(
    fold({
        ok: val => val + 10,
        err: () => 0
    })
);

console.log(foldMethodResult === foldPipeResult); // true

