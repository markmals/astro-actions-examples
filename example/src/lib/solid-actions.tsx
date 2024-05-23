import { batch, children, createSignal, splitProps, untrack } from "solid-js";
import type { ComponentProps, ParentComponent, ParentProps } from "solid-js";
import { ActionError, getActionProps } from "astro:actions";
import type { ErrorInferenceObject, SafeResult } from "astro:actions";

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

    onSubmit?: (event: SubmitEvent) => void;
}

export type Input<A extends AstroAction> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Input : never;

export type Output<A extends AstroAction> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Output : never;

export type Data<A extends AstroAction> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Data : never;

export type Submitter<Input> = ((input: Input) => Promise<void>) &
    (Input extends FormData ? { Form: ParentComponent<FormProps> } : {});

export type Action<Input, Output, Data extends ErrorInferenceObject> = [
    {
        pending: boolean;
        input?: Input;
        result?: Output;
        error?: ActionError<Data>;
        clear(): void;
        retry(): void;
    },
    Submitter<Input>,
];

export type AstroAction<
    Input = any,
    Output = {} | undefined,
    Data extends ErrorInferenceObject = ErrorInferenceObject,
> = {
    safe: (input: Input) => Promise<SafeResult<Data, Output>>;
};

export function useAction<A extends AstroAction>(
    astroAction: A,
): Action<Input<A>, Output<A>, Data<A>> {
    const [input, setInput] = createSignal<Input<A>>();
    const [response, setResponse] = createSignal<{ data?: Output<A>; error?: any }>();

    async function submit(input: Input<A>): Promise<void> {
        batch(() => {
            setResponse(undefined);
            setInput(() => input);
        });

        const res = await astroAction.safe(input);

        setResponse({
            data: res.data as any,
            error: res.error,
        });
    }

    submit.Form = (props: ParentProps & FormProps) => {
        const [locals, formProps] = splitProps(props, ["children", "onSubmit"]);
        const c = children(() => locals.children);

        return (
            <form
                {...formProps}
                method="post"
                onSubmit={async event => {
                    event.preventDefault();
                    // TODO: Throw fatal error if trying to submit FormData to a JSON handler?
                    (submit as Submitter<FormData>)(new FormData(event.currentTarget));
                    // TODO: async onSubmit
                    if (locals.onSubmit) locals.onSubmit(event);
                }}
            >
                <input {...getActionProps(astroAction as any)} />
                {c()}
            </form>
        );
    };

    return [
        {
            get pending(): boolean {
                return !!input() && !response();
            },

            get input(): Input<A> | undefined {
                return input();
            },

            get result(): Output<A> | undefined {
                return response()?.data;
            },

            get error(): ActionError<Data<A>> | undefined {
                return response()?.error;
            },

            clear() {
                batch(() => {
                    setInput(undefined);
                    setResponse(undefined);
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
