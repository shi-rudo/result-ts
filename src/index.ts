// Core
export * from './core/result';
export * from './task';
export * from './errors';

// Pipe Operators and Combinators
// The ./operators entry owns the list. A new operator belongs there, and this
// re-export carries it to the root entry.
export * from './operators';

// Collections
// The ./collections entry owns the list, as above.
export * from './collections';

// Unwrap Utilities
export * from './core/unwrap';
export * from './core/unwrapOr';
export * from './core/unwrapOrElse';
export * from './core/unwrapOrThrow';
export * from './core/unwrapErr';
export * from './core/expectResult';
export * from './core/expectErr';

// Conversions
export * from './core/fromPromise';
export * from './core/fromNullable';
export * from './core/try';
export * from './core/toPromise';
export * from './core/toNullable';

// Utils
export * from './core/isOk';
export * from './core/isErr';
export * from './core/contains';
export * from './core/containsErr';
export * from './core/isResult';
export { matchTag } from './core/matcher';
export type {
    AsyncErrMatchBuilder,
    AsyncErrorMatchBuilder,
    ErrMatchBuilder,
    ErrorMatchBuilder,
} from './core/matcher';
