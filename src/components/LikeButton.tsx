import { actions } from "astro:actions";
import { useState, useOptimistic } from "react";

export interface LikeButtonProps {
    postId: number;
    likeCount: number;
    isLiked: boolean;
}

export function LikeButton(props: LikeButtonProps) {
    const [pending, setPending] = useState(false);

    const [isLiked, setIsLiked] = useState(props.isLiked);
    const [pendingIsLiked, setPendingIsLiked] = useOptimistic<boolean, boolean | undefined>(
        isLiked,
        (state, optimistic) => optimistic ?? state,
    );

    const [count, setCount] = useState(props.likeCount);
    const [pendingCount, setPendingCount] = useOptimistic<number, number | undefined>(
        count,
        (state, optimistic) => optimistic ?? state,
    );

    async function clickLikeButton() {
        setPending(true);
        setPendingIsLiked(!isLiked);
        setPendingCount(isLiked ? count - 1 : count + 1);

        const { data, error } = await actions.like({ postId: props.postId });

        if (error) {
            // Revert to original state
            setIsLiked(isLiked);
        } else {
            // Set to the opposite of the original state
            setIsLiked(!isLiked);
            // Set to the count returned from the server
            setCount(data);
        }

        setPending(false);
    }

    return (
        <>
            <span className="text-sm">{pendingCount}</span>
            <button className="btn-heart" disabled={pending} onClick={clickLikeButton}>
                {pendingIsLiked ? "♥︎" : "♡"}
            </button>
        </>
    );
}
