import {
    batch,
    children,
    createSignal,
    splitProps,
    type ComponentProps,
    type ParentComponent,
    type ParentProps,
} from 'solid-js';
import { getActionProps, type ErrorInferenceObject, type SafeResult } from 'astro:actions';

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

    onSubmit?: (event: SubmitEvent) => void;
}

export type Action<Input, Output> = {
    pending: boolean;
    input?: Input;
    result?: Output;
    error?: any;
    // clear: () => void;
    // retry: () => void;
};

export type Mutator<Input> = ((input: Input) => Promise<void>) & {
    Form: Input extends FormData ? ParentComponent<FormProps> : never;
};

export type Input<A extends AstroAction<any, {}, ErrorInferenceObject>> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Input : never;

export type Output<A extends AstroAction<any, {}, ErrorInferenceObject>> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Output : never;

export type Data<A extends AstroAction<any, {}, ErrorInferenceObject>> =
    A extends AstroAction<infer Input, infer Output, infer Data> ? Data : never;

export type ActionReturn<Input, Output> = [Action<Input, Output>, Mutator<Input>];

export type AstroAction<Input, Output, Data extends ErrorInferenceObject> = {
    safe: (input: Input) => Promise<SafeResult<Data, Output>>;
};

export function useAction<
    // Input extends {} | FormData,
    // Output extends {},
    // Data extends ErrorInferenceObject,
    A extends AstroAction<any, {}, ErrorInferenceObject>,
>(astroAction: A): ActionReturn<Input<A>, Output<A>> {
    const [pending, setPending] = createSignal<boolean>(false);
    const [input, setInput] = createSignal<Input<A>>();
    const [result, setResult] = createSignal<Output<A>>();
    const [error, setError] = createSignal<any>();

    const mutator = ((input: Input<A>) =>
        batch(async () => {
            setInput(input as any);

            setPending(true);
            const res = await astroAction.safe(input);

            if (res.data) {
                setResult(res.data as any);
            }

            if (res.error) {
                setError(res.error);
            }

            setPending(false);
            setInput(undefined);
        })) as Mutator<Input<A>>;

    function Form(props: ParentProps & FormProps) {
        const [_, formProps] = splitProps(props, ['children']);
        const c = children(() => props.children);

        return (
            <form
                {...formProps}
                method="post"
                onSubmit={async e => {
                    e.preventDefault();
                    // TODO: Throw fatal error if trying to submit FormData to a JSON handler
                    (mutator as any)(new FormData(e.currentTarget));
                }}
            >
                <input {...getActionProps(astroAction as any)} />
                {c()}
            </form>
        );
    }

    Object.assign(mutator, { Form });

    const observable = {
        get pending(): boolean {
            return pending();
        },

        get input(): Input<A> | undefined {
            return input();
        },

        get result(): Output<A> | undefined {
            return result();
        },

        get error(): any | undefined {
            return error();
        },

        // clear: () => void {},
        // retry: () => void {},
    };

    return [observable, mutator];
}
