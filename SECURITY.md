# Security

## Reporting a Vulnerability

Report a vulnerability privately through GitHub. Open the **Security** tab of the repository and select **Report a vulnerability**. Do not open a public issue for a vulnerability.

## Scope

`@shirudo/result` is a library. It has no runtime dependencies, and it does no I/O and no network access. It runs inside the process of the consumer, with the permissions of that process.

## Trust Boundaries

### Release Pipeline

The workflow `.github/workflows/release.yml` publishes the package to npm through npm trusted publishing. npm trusts that workflow file in `shi-rudo/result-ts` and nothing else in the repository. The workflow runs when someone publishes a GitHub release, so everyone who can publish a release can publish to npm.

Before the upload, the workflow checks that the release tag equals `v` plus the version in `package.json`. The `prepublishOnly` script then runs the full `pnpm check`. A version below the current `latest` gets the dist-tag `latest-<major>`, so a patch of an older major line leaves `latest` alone. npm attaches a provenance attestation that links the package version to the workflow run and the commit.

A maintainer with npm publish rights can also publish from a local machine. The npm package setting "Require two-factor authentication and disallow tokens" closes that path and leaves trusted publishing as the only one.

### Values from Outside the Process

`JSON.parse` output and other foreign data are plain values, not Results. `isResult()` accepts only a value that carries the brand of the library and a valid `_tag` and payload shape. The library does not validate the payload types `T` and `E`. The consumer validates a foreign payload with a schema tool before it rebuilds a Result with `ok` or `err`.

The brand is a registered symbol (`Symbol.for('@shirudo/result.brand')`), so two copies of the package recognize the Results of each other. JSON cannot carry a symbol, but code in the same process can forge the brand. `isResult()` therefore separates a Result from plain data. It is no defense against a crafted object.

The error messages of the library convert a payload to a string inside a guard. The conversion runs the `toString`, `valueOf`, or `Symbol.toPrimitive` of the payload. If that code throws, the message falls back to `Object.prototype.toString`, and the coded library error still reaches the caller.

## Secrets

The repository holds no secrets. The release workflow authenticates to npm with a short-lived OIDC token that GitHub issues for each run. It uses no npm token.

## Known Risks

- The workflows reference third-party actions by a major version tag such as `actions/checkout@v7`, not by a commit SHA. If someone moves a tag to malicious code, that code runs in the release job, which holds `id-token: write`.
- The branch `main` has no branch protection. Everyone with write access can change the release workflow and then publish a release.
