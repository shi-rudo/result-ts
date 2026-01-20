import { describe, expect, it } from 'vitest';

import { Pipeable } from './pipeable';

class Box<T> extends Pipeable {
    readonly value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }
}

describe('Pipeable', () => {
    it('returns the same instance with no operators', () => {
        const box = new Box(2);
        expect(box.pipe()).toBe(box);
    });

    it('pipes sync operators left to right', () => {
        const box = new Box(2);
        const out = box.pipe(
            (b) => b.value + 1,
            (n) => n * 3,
            (n) => `n=${n}`
        );

        expect(out).toBe('n=9');
    });

    it('pipes async operators and awaits intermediate results', async () => {
        const box = new Box(2);
        const out = await box.pipeAsync(
            async (b) => b.value + 1,
            (n) => n * 2
        );

        expect(out).toBe(6);
    });

    it('returns the same instance with no async operators', async () => {
        const box = new Box(2);
        const out = await box.pipeAsync();
        expect(out).toBe(box);
    });
});
