import { ActionError, getActionProps } from "astro:actions";
import type { ErrorInferenceObject, SafeResult } from "astro:actions";
import { batch, type ReadonlySignal, untracked, useSignal, useComputed } from "@preact/signals";
import { useMemo } from "preact/hooks";
import type { PropsWithChildren } from "preact/compat";
import type { FunctionalComponent, JSX } from "preact";

export type FormMethod = "get" | "post" | "put" | "patch" | "delete";

export interface FormProps extends Omit<JSX.IntrinsicElements["form"], "method" | "onSubmit"> {
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

export type Input<A extends AstroAction> = A extends AstroAction<infer Input> ? Input : never;

export type Output<A extends AstroAction> =
    A extends AstroAction<infer _, infer Output> ? Output : never;

export type Data<A extends AstroAction> =
    A extends AstroAction<infer _, infer _, infer Data> ? Data : never;

export type Action<Input, Output, Data extends ErrorInferenceObject> = {
    pending: ReadonlySignal<boolean>;
    input: ReadonlySignal<Input | undefined>;
    result: ReadonlySignal<Output | undefined>;
    error: ReadonlySignal<ActionError<Data> | undefined>;
    clear(): void;
    retry(): void;
    submit(input: Input): Promise<void>;
} & (Input extends FormData ? { Form: FunctionalComponent<PropsWithChildren<FormProps>> } : {});

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
    type Res = { data?: Output<A>; error?: ActionError<Data<A>> };

    const input = useSignal<Input<A>>();
    const response = useSignal<Res>();

    const submit = useMemo(
        () => async (_input: Input<A>) => {
            batch(() => {
                response.value = undefined;
                // TODO: Validate this on the client and return validated
                input.value = _input;
            });

            const res = await astroAction.safe(input);

            response.value = {
                data: res.data as Output<A>,
                error: res.error,
            };
        },
        [astroAction],
    );

    const Form = useMemo(
        () =>
            ({ children, onSubmit, ...props }: any) => (
                <form
                    {...props}
                    method="post"
                    onSubmit={async event => {
                        event.preventDefault();
                        // TODO: Throw fatal error if trying to submit FormData to a JSON handler?
                        submit(new FormData(event.currentTarget) as Input<A>);
                        // TODO: async onSubmit
                        if (onSubmit) onSubmit(event);
                    }}
                >
                    <input {...getActionProps<any>(astroAction)} />
                    {children}
                </form>
            ),
        [astroAction],
    );

    return {
        pending: useComputed(() => !!input.value && !response.value),
        input: useComputed(() => input.value),
        result: useComputed(() => response.value?.data),
        error: useComputed(() => response.value?.error),
        clear() {
            batch(() => {
                input.value = undefined;
                response.value = undefined;
            });
        },
        retry() {
            const cachedInput = untracked(() => input.value);
            if (!cachedInput) throw new Error("No submission to retry");
            submit(cachedInput);
        },
        submit,
        Form,
    };
}
