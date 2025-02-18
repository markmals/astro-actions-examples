import { actions } from "astro:actions";
import { useAction } from "../lib/solid-actions";
import { Show, createMemo, createSignal } from "solid-js";

export interface LikeButtonProps {
    postId: number;
    likeCount: number;
    isLiked: boolean;
}

export function LikeButton(props: LikeButtonProps) {
    const [likes, like] = useAction(actions.like);
    const [isLiked, setIsLiked] = createSignal(props.isLiked);

    const result = createMemo<number>(
        previous => (likes.result ? likes.result : previous),
        props.likeCount,
    );

    // Optimistic UI
    const likeCount = createMemo(() => {
        if (likes.pending) {
            // By this time we've set isLiked to its optimistic value
            return isLiked() ? result() + 1 : result() - 1;
        }
        return result();
    });

    async function clickLikeButton() {
        setIsLiked(isLiked => !isLiked);
        await like({ postId: props.postId });

        if (likes.error) {
            setIsLiked(isLiked => !isLiked);
        }
    }

    return (
        <>
            <span class="text-sm">{likeCount()}</span>
            <button class="btn-heart" disabled={likes.pending} onClick={clickLikeButton}>
                <Show when={isLiked()} fallback={"♡"}>
                    ♥︎
                </Show>
            </button>
        </>
    );
}
