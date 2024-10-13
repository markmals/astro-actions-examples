import type { ErrorInferenceObject } from 'astro/actions/runtime/utils.js';
import type { ActionError, SafeResult } from 'astro:actions';
import type { z } from 'astro:schema';
import {
    useState,
    type ComponentProps,
    type FormEvent,
    type FunctionComponent,
    type PropsWithChildren,
} from 'react';

export type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface FormProps extends Omit<ComponentProps<'form'>, 'method' | 'onSubmit'> {
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

    onSubmit?: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
}

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

export type ActionState<InputSchema extends z.ZodType, Input, Output> = {
    readonly pending: boolean;
    readonly input?: Input;
    readonly result?: Output;
    readonly error?: ComplexActionError<InputSchema>;

    clear(): void;
    retry(): Promise<void>;
};

export type ActionSubmitter<Input> = ((input: Input) => Promise<void>) &
    (Input extends FormData ? { Form: FunctionComponent<PropsWithChildren<FormProps>> } : {});

export type Action<InputSchema extends z.ZodType, Input, Output> = [
    ActionState<InputSchema, Input, Output>,
    ActionSubmitter<Input>,
];

export function useAction<InputSchema extends z.ZodType, Input, Output>(
    client: ActionClient<Output, InputSchema, Input>,
): Action<InputSchema, Input, Output> {
    const [input, setInput] = useState<Input>();
    const [response, setResponse] = useState<ActionResponse<Output, InputSchema> | undefined>(
        undefined,
    );

    const submitter = async (input: Input) => {
        setResponse(undefined);
        setInput(input);
        setResponse(await client(input));
    };

    submitter.Form = ({ children, onSubmit, ...props }: PropsWithChildren & FormProps) => {
        return (
            <form
                {...props}
                action={client.queryString}
                method="post"
                onSubmit={async (event) => {
                    event.preventDefault();
                    await submitter(new FormData(event.currentTarget) as Input);
                    if (onSubmit) await onSubmit(event);
                }}
            >
                {children}
            </form>
        );
    };

    return [
        {
            pending: input !== undefined && response === undefined,
            input,
            result: response?.data,
            error: response?.error,
            clear() {
                setInput(undefined);
                setResponse(undefined);
            },
            async retry() {
                if (!input) throw new Error('No submission to retry');
                await this.submit(input);
            },
        },
        submitter,
    ];
}
