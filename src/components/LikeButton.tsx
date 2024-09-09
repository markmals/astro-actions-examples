import { actions } from "astro:actions";
import { useAction } from "../lib/actions";
import { useComputed, useSignal, useSignalEffect as useEffect } from "@preact/signals";
import { Show } from "./control-flow/Show";

export interface LikeButtonProps {
    postId: number;
    likeCount: number;
    isLiked: boolean;
}

export function LikeButton(props: LikeButtonProps) {
    const likes = useAction(actions.like);
    const isLiked = useSignal(props.isLiked);

    const prevResult = useSignal(props.likeCount);

    useEffect(() => {
        if (likes.result.value !== undefined) {
            prevResult.value = likes.result.value;
        }
    });

    const result = useComputed(() =>
        likes.result.value === undefined ? prevResult.value : likes.result.value,
    );

    // Optimistic UI
    const likeCount = useComputed(() => {
        if (likes.pending.value) {
            // By this time we've set isLiked to its optimistic value
            return isLiked.value ? result.value + 1 : result.value - 1;
        }
        return result.value;
    });

    async function clickLikeButton() {
        isLiked.value = !isLiked.value;
        await likes.submit({ postId: props.postId });

        if (likes.error.value) {
            isLiked.value = !isLiked.value;
        }
    }

    return (
        <>
            <span class="text-sm">{likeCount}</span>
            <button class="btn-heart" disabled={likes.pending} onClick={clickLikeButton}>
                <Show when={isLiked} fallback={"♡"}>
                    ♥︎
                </Show>
            </button>
        </>
    );
}
