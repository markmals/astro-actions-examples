import { Computed, effect, State } from ".";

// TODO: Caching?
export class Resource<Key, Value> {
    private resolved = false;
    private promise: Promise<Value> | null = null;

    private asyncValue = new State<Value | undefined>(undefined);
    #error = new State(undefined as unknown);
    #state = new State<"unresolved" | "pending" | "ready" | "refreshing" | "errored">(
        this.resolved ? "ready" : "unresolved",
    );

    private read = new Computed(() => {
        const value = this.asyncValue.get();
        const error = this.#error.get();
        if (error !== undefined && !this.promise) throw error;
        return value;
    });

    public constructor(
        private key: () => Key,
        private fetcher: (key: Key) => Value | Promise<Value>,
        options: { signal?: AbortSignal } = {},
    ) {
        effect(
            () => {
                this.load(false);
            },
            { signal: options.signal },
        );
    }

    private loadEnd(p: Promise<Value> | null, v: Value | undefined, error?: any) {
        if (this.promise === p) {
            this.promise = null;
            this.resolved = true;
            this.completeLoad(v, error);
        }
        return v;
    }

    private completeLoad(value: Value | undefined, error: any) {
        if (error === undefined) this.asyncValue.set(value);
        this.#state.set(error !== undefined ? "errored" : "ready");
        this.#error.set(error);
    }

    private load(refetching: Key | boolean = true) {
        if (refetching !== false) return;
        const promise = this.fetcher(this.key());

        if (typeof promise !== "object" || !(promise && "then" in promise)) {
            this.loadEnd(this.promise, promise as Value, undefined);
            return promise;
        }

        this.promise = promise;

        this.#state.set(this.resolved ? "refreshing" : "pending");

        return promise.then(
            v => this.loadEnd(this.promise, v, undefined),
            e => this.loadEnd(this.promise, undefined, this.castError(e)),
        ) as Promise<Value>;
    }

    private castError(err: unknown): Error {
        if (err instanceof Error) return err;
        return new Error(typeof err === "string" ? err : "Unknown error");
    }

    public get(): Value | undefined {
        return this.read.get();
    }

    public set(newValue: Value) {
        this.asyncValue.set(newValue);
    }

    public get state() {
        return this.#state.get();
    }

    public get loading() {
        return this.#state.get() === "pending" || this.#state.get() === "refreshing";
    }

    public get error() {
        return this.#error.get();
    }

    public get latest() {
        if (!this.resolved) return this.read.get();
        if (this.#error.get() && !this.promise) throw this.#error.get();
        return this.asyncValue.get();
    }

    public refetch(key?: Key): Value | Promise<Value> | undefined {
        return this.load(key);
    }
}
