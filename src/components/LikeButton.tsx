import { actions } from 'astro:actions';
import { useAction } from '../lib/action';
import { useRef, useState } from 'react';

export namespace LikeButton {
    export interface Props {
        postId: number;
        likeCount: number;
        isLiked: boolean;
    }
}

export function LikeButton(props: LikeButton.Props) {
    const [likes, like] = useAction(actions.like);
    const [isLiked, setIsLiked] = useState(props.isLiked);

    const initialResult = useRef(props.likeCount);
    const result = likes.result ? likes.result : initialResult.current;
    initialResult.current = result;

    // Optimistic UI
    const likeCount = likes.pending
        ? // By this time we've set isLiked to its optimistic value
          isLiked
            ? result + 1
            : result - 1
        : result;

    const clickLikeButton = async () => {
        setIsLiked((isLiked) => !isLiked);
        await like({ postId: props.postId });
        if (likes.error) {
            setIsLiked((isLiked) => !isLiked);
        }
    };

    return (
        <>
            <span className="text-sm">{likeCount}</span>
            <button className="btn-heart" disabled={likes.pending} onClick={clickLikeButton}>
                {isLiked ? '♥︎' : '♡'}
            </button>
        </>
    );
}
