import { State, untrack } from ".";
import { ActionError } from "astro:actions";
import type { ErrorInferenceObject, SafeResult } from "astro:actions";

export interface AstroAction<
    Input = any,
    Output = {} | undefined,
    Data extends ErrorInferenceObject = ErrorInferenceObject,
> {
    safe: (input: Input) => Promise<SafeResult<Data, Output>>;
}

export type Input<A extends AstroAction> = A extends AstroAction<infer Input> ? Input : never;

export type Output<A extends AstroAction> =
    A extends AstroAction<infer Input, infer Output> ? Output : never;

export type Data<A extends AstroAction> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Data : never;

export namespace AstroAction {
    export type Response<Action extends AstroAction> = {
        data?: Output<Action>;
        error?: ActionError<Data<Action>>;
    };
}

export class Action<A extends AstroAction> {
    #action: A;

    #input = new State<Input<A> | undefined>(undefined);
    #response = new State<AstroAction.Response<A> | undefined>(undefined);

    public get pending(): boolean {
        return !!this.#input.get() && !this.#response.get();
    }

    public get input(): Input<A> | undefined {
        return this.#input.get();
    }

    public get result(): Output<A> | undefined {
        return this.#response.get()?.data;
    }

    public get error(): ActionError<Data<A>> | undefined {
        return this.#response.get()?.error;
    }

    constructor(action: A) {
        this.#action = action;
    }

    clear() {
        this.#input.set(undefined);
        this.#response.set(undefined);
    }

    retry() {
        const cachedInput = untrack(() => this.#input.get());
        if (!cachedInput) throw new Error("No submission to retry");
        this.submit(cachedInput);
    }

    async submit(input: Input<A>): Promise<void> {
        this.#response.set(undefined);
        this.#input.set(input);
        this.#response.set((await this.#action.safe(input)) as AstroAction.Response<A>);
    }
}
