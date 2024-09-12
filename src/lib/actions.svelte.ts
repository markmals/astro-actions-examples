import type { ErrorInferenceObject } from "astro/actions/runtime/utils.js";
import type { ActionError, SafeResult } from "astro:actions";
import type { z } from "astro:schema";
import { untrack } from "svelte";

type ComplexActionError<TInputSchema extends z.ZodType> = ActionError<
    z.input<TInputSchema> extends ErrorInferenceObject
        ? z.input<TInputSchema>
        : ErrorInferenceObject
>;

type ActionClient<
    Output,
    InputSchema extends z.ZodType,
    Input = z.input<InputSchema> | FormData,
> = ((
    input: Input,
) => Promise<
    SafeResult<
        z.input<InputSchema> extends ErrorInferenceObject
            ? z.input<InputSchema>
            : ErrorInferenceObject,
        Awaited<Output>
    >
>) & {
    queryString: string;
    orThrow: (input: Input) => Promise<Awaited<Output>>;
};

type ActionResponse<Output, InputSchema extends z.ZodType> = {
    data?: Output;
    error?: ComplexActionError<InputSchema>;
};

export class Action<InputSchema extends z.ZodType, Input, Output> {
    #input = $state<Input>();
    #response = $state<ActionResponse<Output, InputSchema>>({
        data: undefined,
        error: undefined,
    });

    #client: ActionClient<Output, InputSchema, Input>;

    constructor(client: ActionClient<Output, InputSchema, Input>) {
        this.#client = client;
    }

    get pending(): boolean {
        return (
            this.#input !== undefined &&
            this.#response?.data === undefined &&
            this.#response.error === undefined
        );
    }

    get input(): Input | undefined {
        return this.#input;
    }

    get result(): Output | undefined {
        return this.#response?.data;
    }

    get error(): ComplexActionError<InputSchema> | undefined {
        return this.#response?.error;
    }

    clear() {
        this.#input = undefined;
        this.#response = { data: undefined, error: undefined };
    }

    async retry() {
        const cachedInput = untrack(() => this.#input);
        if (!cachedInput) throw new Error("No submission to retry");
        await this.submit(cachedInput);
    }

    async submit(input: Input) {
        this.#response = { data: undefined, error: undefined };
        this.#input = input;
        this.#response = await this.#client(input);
    }

    get formAction(): string {
        return this.#client.queryString;
    }

    formMethod = "post";
}
