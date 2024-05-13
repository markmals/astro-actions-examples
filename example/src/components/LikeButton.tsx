import { actions } from 'astro:actions';
import { useAction } from '../lib/solid-actions';
import { createMemo } from 'solid-js';

export function LikeButton(props: { initialLikes: number; postId: string }) {
    const [likes, like] = useAction(actions.like);

    // Optimistic UI
    const likeCount = createMemo(() => {
        const count = likes.result ?? props.initialLikes;
        if (likes.input) return count + 1;
        return count;
    });

    return (
        <div>
            <span>Likes: {likeCount()}</span>
            <button disabled={likes.pending} onClick={() => like({ postId: props.postId })}>
                ❤️
            </button>
        </div>
    );
}
