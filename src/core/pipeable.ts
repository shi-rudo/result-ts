export type UnaryFunction<Input, Output> = (input: Input) => Output;
export type Awaitable<T> = T | Promise<T>;

export abstract class Pipeable {
    // -------------------------------------------------------------------------
    // PIPE (Synchron)
    // -------------------------------------------------------------------------

    pipe<A>(this: A): A;
    pipe<A, B>(this: A, ab: UnaryFunction<A, B>): B;
    pipe<A, B, C>(this: A, ab: UnaryFunction<A, B>, bc: UnaryFunction<B, C>): C;
    pipe<A, B, C, D>(this: A, ab: UnaryFunction<A, B>, bc: UnaryFunction<B, C>, cd: UnaryFunction<C, D>): D;
    pipe<A, B, C, D, E>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>
    ): E;
    pipe<A, B, C, D, E, F>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>
    ): F;
    pipe<A, B, C, D, E, F, G>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>
    ): G;
    pipe<A, B, C, D, E, F, G, H>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>
    ): H;
    pipe<A, B, C, D, E, F, G, H, I>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>
    ): I;
    pipe<A, B, C, D, E, F, G, H, I, J>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>
    ): J;
    pipe<A, B, C, D, E, F, G, H, I, J, K>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>
    ): K;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>
    ): L;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>
    ): M;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>
    ): N;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>
    ): O;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>
    ): P;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>,
        pq: UnaryFunction<P, Q>
    ): Q;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>,
        pq: UnaryFunction<P, Q>,
        qr: UnaryFunction<Q, R>
    ): R;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>,
        pq: UnaryFunction<P, Q>,
        qr: UnaryFunction<Q, R>,
        rs: UnaryFunction<R, S>
    ): S;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>,
        pq: UnaryFunction<P, Q>,
        qr: UnaryFunction<Q, R>,
        rs: UnaryFunction<R, S>,
        st: UnaryFunction<S, T>
    ): T;
    pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<B, C>,
        cd: UnaryFunction<C, D>,
        de: UnaryFunction<D, E>,
        ef: UnaryFunction<E, F>,
        fg: UnaryFunction<F, G>,
        gh: UnaryFunction<G, H>,
        hi: UnaryFunction<H, I>,
        ij: UnaryFunction<I, J>,
        jk: UnaryFunction<J, K>,
        kl: UnaryFunction<K, L>,
        lm: UnaryFunction<L, M>,
        mn: UnaryFunction<M, N>,
        no: UnaryFunction<N, O>,
        op: UnaryFunction<O, P>,
        pq: UnaryFunction<P, Q>,
        qr: UnaryFunction<Q, R>,
        rs: UnaryFunction<R, S>,
        st: UnaryFunction<S, T>,
        tu: UnaryFunction<T, U>
    ): U;

    pipe(this: any, ...ops: Array<UnaryFunction<any, any>>): any {
        let ret: any = this;
        for (const op of ops) {
            ret = op(ret);
        }
        return ret;
    }

    // -------------------------------------------------------------------------
    // PIPE ASYNC (Asynchron)
    // -------------------------------------------------------------------------

    pipeAsync<A>(this: A): Promise<A>;
    pipeAsync<A, B>(this: A, ab: UnaryFunction<A, B>): Promise<Awaited<B>>;
    pipeAsync<A, B, C>(this: A, ab: UnaryFunction<A, B>, bc: UnaryFunction<Awaited<B>, C>): Promise<Awaited<C>>;
    pipeAsync<A, B, C, D>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>
    ): Promise<Awaited<D>>;
    pipeAsync<A, B, C, D, E>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>
    ): Promise<Awaited<E>>;
    pipeAsync<A, B, C, D, E, F>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>
    ): Promise<Awaited<F>>;
    pipeAsync<A, B, C, D, E, F, G>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>
    ): Promise<Awaited<G>>;
    pipeAsync<A, B, C, D, E, F, G, H>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>
    ): Promise<Awaited<H>>;
    pipeAsync<A, B, C, D, E, F, G, H, I>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>
    ): Promise<Awaited<I>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>
    ): Promise<Awaited<J>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>
    ): Promise<Awaited<K>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>
    ): Promise<Awaited<L>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>
    ): Promise<Awaited<M>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>
    ): Promise<Awaited<N>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>
    ): Promise<Awaited<O>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>
    ): Promise<Awaited<P>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>,
        pq: UnaryFunction<Awaited<P>, Q>
    ): Promise<Awaited<Q>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>,
        pq: UnaryFunction<Awaited<P>, Q>,
        qr: UnaryFunction<Awaited<Q>, R>
    ): Promise<Awaited<R>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>,
        pq: UnaryFunction<Awaited<P>, Q>,
        qr: UnaryFunction<Awaited<Q>, R>,
        rs: UnaryFunction<Awaited<R>, S>
    ): Promise<Awaited<S>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>,
        pq: UnaryFunction<Awaited<P>, Q>,
        qr: UnaryFunction<Awaited<Q>, R>,
        rs: UnaryFunction<Awaited<R>, S>,
        st: UnaryFunction<Awaited<S>, T>
    ): Promise<Awaited<T>>;
    pipeAsync<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
        this: A,
        ab: UnaryFunction<A, B>,
        bc: UnaryFunction<Awaited<B>, C>,
        cd: UnaryFunction<Awaited<C>, D>,
        de: UnaryFunction<Awaited<D>, E>,
        ef: UnaryFunction<Awaited<E>, F>,
        fg: UnaryFunction<Awaited<F>, G>,
        gh: UnaryFunction<Awaited<G>, H>,
        hi: UnaryFunction<Awaited<H>, I>,
        ij: UnaryFunction<Awaited<I>, J>,
        jk: UnaryFunction<Awaited<J>, K>,
        kl: UnaryFunction<Awaited<K>, L>,
        lm: UnaryFunction<Awaited<L>, M>,
        mn: UnaryFunction<Awaited<M>, N>,
        no: UnaryFunction<Awaited<N>, O>,
        op: UnaryFunction<Awaited<O>, P>,
        pq: UnaryFunction<Awaited<P>, Q>,
        qr: UnaryFunction<Awaited<Q>, R>,
        rs: UnaryFunction<Awaited<R>, S>,
        st: UnaryFunction<Awaited<S>, T>,
        tu: UnaryFunction<Awaited<T>, U>
    ): Promise<Awaited<U>>;

    async pipeAsync(this: any, ...ops: Array<(a: any) => Awaitable<any>>): Promise<any> {
        let ret: any = this;
        for (const op of ops) {
            ret = await op(ret);
        }
        return ret;
    }
}

