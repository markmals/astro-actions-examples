import { ActionError } from "astro:actions";
import type { ErrorInferenceObject, SafeResult } from "astro:actions";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { AsyncDirective, directive, type DirectiveResult } from "lit/async-directive.js";

export interface AstroAction<
    Input = any,
    Output = {} | undefined,
    Data extends ErrorInferenceObject = ErrorInferenceObject,
> {
    safe: (input: Input) => Promise<SafeResult<Data, Output>>;
}

export type Input<A extends AstroAction> =
    A extends AstroAction<infer Input, {} | undefined, ErrorInferenceObject> ? Input : never;

export type Output<A extends AstroAction> =
    A extends AstroAction<any, infer Output, ErrorInferenceObject> ? Output : never;

export type Data<A extends AstroAction> =
    A extends AstroAction<any, {} | undefined, infer Data> ? Data : never;

export namespace AstroAction {
    export type Response<Action extends AstroAction> = {
        data?: Output<Action>;
        error?: ActionError<Data<Action>>;
    };
}

export class Action<WrappedAction extends AstroAction> /* implements ReactiveController */ {
    #action: WrappedAction;
    #host: ReactiveControllerHost;

    #inputStorage: Input<WrappedAction> | undefined;
    #responseStorage: AstroAction.Response<WrappedAction> | undefined;

    get #input() {
        return this.#inputStorage;
    }

    set #input(value: Input<WrappedAction> | undefined) {
        this.#inputStorage = value;
        this.#host.requestUpdate();
    }

    get #response() {
        return this.#responseStorage;
    }

    set #response(value: AstroAction.Response<WrappedAction> | undefined) {
        this.#responseStorage = value;
        this.#host.requestUpdate();
    }

    public get pending(): boolean {
        return !!this.#input && !this.#response;
    }

    public get input(): Input<WrappedAction> | undefined {
        return this.#input;
    }

    public get result(): Output<WrappedAction> | undefined {
        return this.#response?.data;
    }

    public get error(): ActionError<Data<WrappedAction>> | undefined {
        return this.#response?.error;
    }

    constructor(host: ReactiveControllerHost, action: WrappedAction) {
        this.#action = action;
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

    async submit(input: Input<WrappedAction>): Promise<void> {
        this.#response = undefined;
        this.#input = input;
        this.#response = (await this.#action.safe(input)) as AstroAction.Response<WrappedAction>;
    }

    // enhanceForm(): DirectiveResult {
    //     class FormDirective extends AsyncDirective {

    //     }

    //     const form = directive(FormDirective)

    //     return form();
    // }
}
