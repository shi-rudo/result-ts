import { describe, expect, it } from 'vitest';
import fc from 'fast-check';

import { combine, err, flatMap, map, ok, sequence, zip, type Result } from '../index';

const resultArbitrary = fc.oneof(
    fc.integer().map(value => ok<number, string>(value)),
    fc.string().map(error => err<string, number>(error))
);

describe('Result properties', () => {
    it('map identity preserves Result semantics', () => {
        fc.assert(
            fc.property(resultArbitrary, result => {
                expect(result.pipe(map(value => value))).toEqual(result);
            })
        );
    });

    it('map composition is equivalent to a single composed map', () => {
        fc.assert(
            fc.property(resultArbitrary, result => {
                const addOne = (value: number) => value + 1;
                const double = (value: number) => value * 2;

                const twoSteps = result.pipe(map(addOne), map(double));
                const oneStep = result.pipe(map(value => double(addOne(value))));

                expect(twoSteps).toEqual(oneStep);
            })
        );
    });

    it('flatMap with ok is a right identity', () => {
        fc.assert(
            fc.property(resultArbitrary, result => {
                const out = result.pipe(flatMap(value => ok<number, string>(value)));

                expect(out).toEqual(result);
            })
        );
    });

    it('sequence returns all values only when every Result is Ok', () => {
        fc.assert(
            fc.property(fc.array(resultArbitrary), results => {
                const out = sequence(results);
                const firstErr = results.find((result): result is Result<number, string> & { readonly _tag: 'Err' } => result.isErr());

                if (firstErr) {
                    expect(out).toBe(firstErr);
                    return;
                }

                expect(out).toEqual(ok(results.map(result => result.unwrap())));
            })
        );
    });

    it('zip short-circuits from left to right', () => {
        fc.assert(
            fc.property(resultArbitrary, resultArbitrary, (left, right) => {
                const out = zip(left, right);

                if (left.isErr()) {
                    expect(out).toBe(left);
                    return;
                }

                if (right.isErr()) {
                    expect(out).toBe(right);
                    return;
                }

                expect(out).toEqual(ok([left.value, right.value]));
            })
        );
    });

    it('combine collects every present error', () => {
        fc.assert(
            fc.property(resultArbitrary, resultArbitrary, (left, right) => {
                const out = combine(left, right);

                if (left.isOk() && right.isOk()) {
                    expect(out).toEqual(ok([left.value, right.value]));
                    return;
                }

                const expectedErrors = [
                    ...(left.isErr() ? [left.error] : []),
                    ...(right.isErr() ? [right.error] : []),
                ];

                expect(out).toEqual(err(expectedErrors));
            })
        );
    });
});
