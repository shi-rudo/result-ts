import { err, ok, type Err, type Result } from "../result";

export const validateRequest = (input: unknown): Result<string, string> => {
    if (typeof input !== 'string' || input === null) {
        return err('Input is not a string');
    }
    return ok(input);
};


const caller = (): Result<string, string> => {
    const result = validateRequest('hello');
    return result;
};

const caller2 = (): Result<string, Error> => {
    const result = validateRequest('hello');
    if (result.isErr()) return err(new Error(result.error));
    return ok(result.unwrap());
};

const goLike = (): Result<number, string> => {
    const result = validateRequest('helloGoLike');
    if (result.isErr()) return result;
    return ok(result.unwrap().length);
};

caller();
caller2();
goLike();
