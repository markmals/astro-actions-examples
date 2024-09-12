<script module lang="ts">
    export interface Props {
        postId: number;
        likeCount: number;
        isLiked: boolean;
    }
</script>

<script lang="ts">
    import { Action } from "../lib/actions.svelte";
    import { actions } from "astro:actions";
    import { deriveFrom } from "../lib/derive-from.svelte";

    let props: Props = $props();

    const likes = new Action(actions.like);
    let isLiked = $state(props.isLiked);

    const result = deriveFrom<number>(props.likeCount, previous =>
        likes.result ? likes.result : previous,
    );

    // Optimistic UI
    const likeCount = $derived.by(() => {
        if (likes.pending) {
            // By this time we've set isLiked to its optimistic value
            return isLiked ? result() + 1 : result() - 1;
        }
        return result();
    });

    async function clickLikeButton() {
        isLiked = !isLiked;
        await likes.submit({ postId: props.postId });

        if (likes.error) {
            isLiked = !isLiked;
        }
    }
</script>

<span class="text-sm">{likeCount}</span>
<button class="btn-heart" disabled={likes.pending} onclick={clickLikeButton}>
    {#if isLiked}
        ♥︎
    {:else}
        ♡
    {/if}
</button>
