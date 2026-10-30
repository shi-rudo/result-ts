import {
    filterAsync,
    flatMapAsync,
    foldAsync,
    mapAsync,
    mapErrAsync,
    type Result,
    tapAsync,
    tryCatchAsync,
    tryMapAsync,
} from '../index';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

declare const source: Result<number, 'parse'>;
declare function parse(value: number): Result<string, 'range'>;
declare function parseLater(value: number): Promise<Result<string, 'range'>>;

const mappedSync = source.pipeAsync(mapAsync(value => value + 1));
const mappedAsync = source.pipeAsync(mapAsync(async value => value + 1));
type MapAsyncAcceptsASynchronousProjection = Expect<Equal<typeof mappedSync, Promise<Result<number, 'parse'>>>>;
type MapAsyncUnwrapsAnAsynchronousProjection = Expect<Equal<typeof mappedAsync, Promise<Result<number, 'parse'>>>>;

const errorMappedSync = source.pipeAsync(mapErrAsync(error => `${error}!` as const));
type MapErrAsyncAcceptsASynchronousProjection = Expect<Equal<typeof errorMappedSync, Promise<Result<number, 'parse!'>>>>;

const chainedSync = source.pipeAsync(flatMapAsync(parse));
const chainedAsync = source.pipeAsync(flatMapAsync(parseLater));
type FlatMapAsyncAcceptsASynchronousProjection = Expect<Equal<typeof chainedSync, Promise<Result<string, 'parse' | 'range'>>>>;
type FlatMapAsyncUnwrapsAnAsynchronousProjection = Expect<Equal<typeof chainedAsync, Promise<Result<string, 'parse' | 'range'>>>>;

const seen: number[] = [];
const tapped = source.pipeAsync(tapAsync({ ok: value => seen.push(value), err: error => console.log(error) }));
type TapAsyncAcceptsSynchronousObservers = Expect<Equal<typeof tapped, Promise<Result<number, 'parse'>>>>;

const filtered = source.pipeAsync(filterAsync(value => value > 0, () => 'parse' as const));
type FilterAsyncAcceptsASynchronousPredicateAndErrorFactory = Expect<Equal<typeof filtered, Promise<Result<number, 'parse'>>>>;

const folded = source.pipeAsync(foldAsync({ ok: value => value * 2, err: async () => 0 }));
type FoldAsyncAcceptsSynchronousAndAsynchronousHandlers = Expect<Equal<typeof folded, Promise<number>>>;

const caught = source.pipeAsync(tryCatchAsync(() => JSON.parse('{}') as unknown, () => 'json' as const));
type TryCatchAsyncAcceptsASynchronousFunction = Expect<Equal<typeof caught, Promise<Result<unknown, 'parse' | 'json'>>>>;

const triedMap = source.pipeAsync(tryMapAsync(value => value.toFixed(2), () => 'format' as const));
type TryMapAsyncAcceptsASynchronousProjection = Expect<Equal<typeof triedMap, Promise<Result<string, 'parse' | 'format'>>>>;
