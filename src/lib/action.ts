import type { ErrorInferenceObject } from 'astro/actions/runtime/utils.js';
import type { ActionError, SafeResult } from 'astro:actions';
import type { z } from 'astro:schema';
import { shallowRef, ref, pauseTracking, resetTracking } from '@vue/reactivity';
import type { UnwrapRef } from '@vue/reactivity';
import { type Directive } from 'vue';

function untrack<T>(nonReactiveReadsFn: () => T): T {
    pauseTracking();
    const value = nonReactiveReadsFn();
    resetTracking();
    return value;
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

export type Action<InputSchema extends z.ZodType, Input, Output> = {
    readonly pending: boolean;
    readonly input?: Input;
    readonly result?: UnwrapRef<Output>;
    readonly error?: ComplexActionError<InputSchema>;

    clear(): void;
    retry(): Promise<void>;

    submit(input: Input): Promise<void>;
    readonly formAction: string;
    readonly formMethod: 'post';
};

export function useAction<InputSchema extends z.ZodType, Input, Output>(
    client: ActionClient<Output, InputSchema, Input>,
): Action<InputSchema, Input, Output> {
    const inputRef = shallowRef<Input>();
    const response = ref<ActionResponse<Output, InputSchema> | undefined>(undefined);

    return {
        get pending(): boolean {
            return inputRef.value !== undefined && response.value === undefined;
        },
        get input(): Input | undefined {
            return inputRef.value;
        },
        get result(): UnwrapRef<Output> | undefined {
            return response.value?.data;
        },
        get error(): ComplexActionError<InputSchema> | undefined {
            return response.value?.error;
        },
        clear() {
            inputRef.value = undefined;
            response.value = undefined;
        },
        async retry() {
            const cachedInput = untrack(() => inputRef.value);
            if (!cachedInput) throw new Error('No submission to retry');
            await this.submit(cachedInput);
        },
        async submit(input: Input) {
            response.value = undefined;
            inputRef.value = input;
            response.value = await client(input);
        },
        get formAction(): string {
            return client.queryString;
        },
        formMethod: 'post',
    };
}

export type EnhanceDirective = Directive<HTMLFormElement, Action<any, FormData, any>>;
export const vEnhance: EnhanceDirective = {
    mounted: (form, binding) => {
        form.method = binding.value.formMethod;
        form.action = binding.value.formAction;
        form.addEventListener(
            'submit',
            async (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
                event.preventDefault();
                await binding.value.submit(new FormData(event.currentTarget));
            },
        );
    },
    getSSRProps: (binding) => ({
        method: binding.value.formMethod,
        action: binding.value.formAction,
    }),
};
