import { batch, children, createSignal, splitProps, untrack } from "solid-js";
import type { ComponentProps, ParentComponent, ParentProps } from "solid-js";
import { ActionError } from "astro:actions";
import type { SafeResult } from "astro:actions";
import { createStore, reconcile } from "solid-js/store";
import type { ErrorInferenceObject } from "astro/actions/runtime/utils.js";
import type { z } from "astro:schema";

export type FormMethod = "get" | "post" | "put" | "patch" | "delete";

export interface FormProps extends Omit<ComponentProps<"form">, "method" | "onSubmit"> {
    /**
     * The HTTP verb to use when the form is submit. Supports "get", "post",
     * "put", "delete", "patch".
     *
     * Note: If JavaScript is disabled, you'll need to implement your own "method
     * override" to support more than just GET and POST.
     */
    method?: FormMethod;

    /**
     * Normal `<form action>` but supports React Router's relative paths.
     */
    action?: string;

    /**
     * Normal `<form encType>`.
     *
     * Note: Remix only supports `application/x-www-form-urlencoded` right now
     * but will soon support `multipart/form-data` as well.
     */
    // encType?: FormEncType;
    /**
     * Forces a full document navigation instead of a fetch.
     */
    reloadDocument?: boolean;

    /**
     * Replaces the current entry in the browser history stack when the form
     * navigates. Use this if you don't want the user to be able to click "back"
     * to the page with the form on it.
     */
    replace?: boolean;

    onSubmit?: (event: SubmitEvent) => Promise<void> | void;
}

export type ActionSubmitter<Input> = ((input: Input) => Promise<void>) &
    (Input extends FormData ? { Form: ParentComponent<FormProps> } : {});

export interface ActionState<InputSchema extends z.ZodType, Input, Output> {
    pending: boolean;
    input?: Input;
    result?: Output;
    error?: ComplexActionError<InputSchema>;
    clear(): void;
    retry(): void;
}

export type Action<InputSchema extends z.ZodType, Input, Output> = [
    ActionState<InputSchema, Input, Output>,
    ActionSubmitter<Input>,
];

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

export function useAction<InputSchema extends z.ZodType, Input, Output>(
    client: ActionClient<Output, InputSchema, Input>,
): Action<InputSchema, Input, Output> {
    type Res = {
        data?: Output;
        error?: ComplexActionError<InputSchema>;
    };

    const [input, setInput] = createSignal<Input>();
    const [response, setResponse] = createStore<Res>({ data: undefined, error: undefined });

    async function submit(input: Input): Promise<void> {
        batch(() => {
            setResponse({ data: undefined, error: undefined });
            setInput(() => input);
        });

        const res = await client(input);
        setResponse(reconcile(res));
    }

    submit.Form = (props: ParentProps & FormProps) => {
        const [locals, formProps] = splitProps(props, ["children", "onSubmit"]);
        const c = children(() => locals.children);

        return (
            <form
                {...formProps}
                action={client.queryString}
                method="post"
                onSubmit={async event => {
                    event.preventDefault();
                    await submit(new FormData(event.currentTarget) as Input);
                    if (locals.onSubmit) await locals.onSubmit(event);
                }}
            >
                {c()}
            </form>
        );
    };

    return [
        {
            get pending(): boolean {
                return !!input() && !response?.data && !response.error;
            },
            get input(): Input | undefined {
                return input();
            },
            get result(): Output | undefined {
                return response?.data;
            },
            get error(): ComplexActionError<InputSchema> | undefined {
                return response?.error;
            },
            clear() {
                batch(() => {
                    setInput(undefined);
                    setResponse({ data: undefined, error: undefined });
                });
            },
            retry() {
                const cachedInput = untrack(input);
                if (!cachedInput) throw new Error("No submission to retry");
                submit(cachedInput);
            },
        },
        submit,
    ];
}
