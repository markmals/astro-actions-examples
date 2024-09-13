import type { ErrorInferenceObject } from "astro/actions/runtime/utils.js";
import type { ActionError, SafeResult } from "astro:actions";
import type { z } from "astro:schema";
import type { ReactiveControllerHost } from "lit";
import { AsyncDirective, directive, type DirectiveResult } from "lit/async-directive.js";

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
};

type ActionResponse<Output, InputSchema extends z.ZodType> = {
    data?: Output;
    error?: ComplexActionError<InputSchema>;
};

export class ActionController<InputSchema extends z.ZodType, Input, Output> {
    #client: ActionClient<Output, InputSchema, Input>;
    #host: ReactiveControllerHost;

    #inputStorage?: Input;
    #responseStorage?: ActionResponse<Output, InputSchema>;

    get #input() {
        return this.#inputStorage;
    }

    set #input(value: Input | undefined) {
        this.#inputStorage = value;
        this.#host.requestUpdate();
    }

    get #response() {
        return this.#responseStorage;
    }

    set #response(value: ActionResponse<Output, InputSchema> | undefined) {
        this.#responseStorage = value;
        this.#host.requestUpdate();
    }

    public get pending(): boolean {
        return !!this.#input && !this.#response;
    }

    public get input(): Input | undefined {
        return this.#input;
    }

    public get result(): Output | undefined {
        return this.#response?.data;
    }

    public get error(): ComplexActionError<InputSchema> | undefined {
        return this.#response?.error;
    }

    constructor(host: ReactiveControllerHost, client: ActionClient<Output, InputSchema, Input>) {
        this.#client = client;
        this.#host = host;
    }

    clear() {
        this.#input = undefined;
        this.#response = undefined;
    }

    retry() {
        if (!this.#input) throw new Error("No submission to retry");
        this.submit(this.#input);
    }

    async submit(input: Input): Promise<void> {
        this.#response = undefined;
        this.#input = input;
        this.#response = await this.#client(input);
    }

    // enhanceForm(): DirectiveResult {
    //     class FormDirective extends AsyncDirective {

    //     }

    //     const form = directive(FormDirective)

    //     return form();
    // }
}
