import { describe, expect, it } from 'vitest';

import { chooseDistTag } from './choose-dist-tag.mjs';

describe('chooseDistTag', () => {
    it('tags a version above the current latest as latest', () => {
        expect(chooseDistTag('2.0.0', '1.2.0')).toBe('latest');
    });

    it('tags a version below the current latest with the tag of its major line', () => {
        expect(chooseDistTag('1.2.1', '2.0.0')).toBe('latest-1');
    });

    it('compares each part of the version as a number', () => {
        expect(chooseDistTag('1.10.0', '1.9.0')).toBe('latest');
        expect(chooseDistTag('1.2.1', '10.0.0')).toBe('latest-1');
    });

    it('tags the first published version as latest', () => {
        expect(chooseDistTag('1.0.0', '')).toBe('latest');
    });

    it('rejects a version that is already the latest one', () => {
        expect(() => chooseDistTag('2.0.0', '2.0.0')).toThrow('2.0.0 is already the latest version on npm');
    });

    it('rejects a prerelease, which needs a dist-tag of its own', () => {
        expect(() => chooseDistTag('2.1.0-beta.1', '2.0.0')).toThrow('2.1.0-beta.1 is not a plain major.minor.patch version');
    });
});
