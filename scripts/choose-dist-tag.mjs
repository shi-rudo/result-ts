// Chooses the npm dist-tag for a release, so that a patch of an older major
// line does not move `latest` back to that line.
// Usage: node scripts/choose-dist-tag.mjs <version> <current latest or "">

import { fileURLToPath } from 'node:url';

const PLAIN_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

const parseVersion = (version) => {
    const match = PLAIN_VERSION.exec(version);
    if (!match) {
        throw new Error(`${version} is not a plain major.minor.patch version. A prerelease needs a dist-tag of its own.`);
    }
    return match.slice(1).map(Number);
};

const compareVersions = (left, right) => {
    for (let index = 0; index < left.length; index++) {
        if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
};

export function chooseDistTag(version, latest) {
    const next = parseVersion(version);
    if (latest === '') return 'latest';

    const order = compareVersions(next, parseVersion(latest));
    if (order === 0) throw new Error(`${version} is already the latest version on npm.`);
    return order > 0 ? 'latest' : `latest-${next[0]}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [version, latest = ''] = process.argv.slice(2);
    console.log(chooseDistTag(version, latest));
}
