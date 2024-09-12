<script module lang="ts">
    import type { Snippet } from "svelte";
    import type { Action } from "./actions.svelte";

    export interface Props {
        children: Snippet;
        action: Action<any, FormData, any>;
        class?: string;
        onsubmit?: (
            event: SubmitEvent & {
                currentTarget: EventTarget & HTMLFormElement;
            },
        ) => Promise<void> | void;
    }
</script>

<script lang="ts">
    let { children, action, onsubmit, ...props }: Props = $props();
</script>

<form
    {...props}
    method={action.formMethod}
    action={action.formAction}
    onsubmit={async event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        await onsubmit?.(event);
        await action.submit(data);
    }}
>
    {@render children()}
</form>
