import { actions, type SafeResult } from "astro:actions";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { Alert } from "./Alert";
import { useActionState, useOptimistic, useState, type PropsWithChildren } from "react";
import { experimental_withState as withState } from "@astrojs/react/actions";
import type { z } from "astro:schema";
import type { commentSchema } from "../actions/comment";
import { useDerived } from "../lib/useDerived";

export interface CommentFormProps extends PropsWithChildren {
    currentUser: HydratedPost["user"];
    postId: number;
}

export function CommentForm(props: CommentFormProps) {
    const [comments, setComments] = useState<string[]>([]);
    const [optimisticComments, setOptimisticComments] = useOptimistic<string[], string>(
        comments,
        (state, newComment) => [...state, newComment],
    );

    // How do I use setOptimisticComments in here...?
    const [state, action, pending] = useActionState(withState(actions.comment), {
        data: undefined,
        error: undefined,
    });

    const [content, setContent] = useState("");

    const haveNewError = !pending && state.error;
    // Get previous content from the optimistic data, because content is empty
    const displayedContent = haveNewError && input ? input : content;

    // const [input, setInput] = useOptimistic(content, (state, optimistic) => optimistic ?? state);

    const [commentId, setCommentId] = useState(crypto.randomUUID());

    // const commentId = useDerived<string>(
    //     // If we're not waiting on a response and we have a result, then reset our id
    //     previous => (!pending && state.data ? crypto.randomUUID() : previous),
    //     crypto.randomUUID(),
    // );

    const comment = (() => {
        if (state.data) {
            return {
                ...state.data.Comment,
                user: state.data.User,
            };
        } else if (input !== "" && !state.error) {
            return {
                id: commentId,
                content: input,
                createdOn: new Date(),
                user: {
                    name: props.currentUser.name,
                    image: props.currentUser.image,
                },
            };
        }

        return undefined;
    })();

    // const comments = createMemo<Comment[]>(previous => {
    //     const haveNewError = !pending && state.error;
    //     if (haveNewError) {
    //         return previous.filter(comment => comment.id !== commentId);
    //     }

    //     if (comment) {
    //         return previous.some(c => c.id === comment.id)
    //             ? previous.map(c => (c.id === comment.id ? comment : c))
    //             : [...previous, comment];
    //     }

    //     return previous;
    // }, []);

    return (
        <>
            <ul role="list" className="comments">
                {/* Server-rendered comments */}
                {props.children}
                {/* Client-rendered comments */}
                {comments.map(comment => (
                    <CommentPreview comment={comment} />
                ))}
            </ul>

            {/* New comment form */}
            <div className="comment-form-container">
                <img src={props.currentUser.image} />
                <form action={action} onSubmit={() => setContent("")}>
                    <input type="hidden" id="postId" name="postId" value={props.postId} />
                    <input type="hidden" id="commentId" name="commentId" value={commentId} />

                    <div className="text-area-container">
                        <label htmlFor="comment" className="sr-only">
                            Add your comment
                        </label>
                        <textarea
                            rows={2}
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value={displayedContent}
                            onInput={e => setContent(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="button-container">
                        <button type="submit" disabled={pending}>
                            Comment
                        </button>
                    </div>
                </form>
            </div>

            {state.error && <Alert>{state.error.message}</Alert>}
        </>
    );
}
