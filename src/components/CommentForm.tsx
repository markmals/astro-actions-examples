import { actions } from "astro:actions";
import { useAction } from "../lib/solid-actions";
import { For, Show, createMemo, createSignal } from "solid-js";
import type { ParentProps } from "solid-js";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { Alert } from "./Alert";

export interface CommentFormProps extends ParentProps {
    currentUser: HydratedPost["user"];
    postId: number;
}

export function CommentForm(props: CommentFormProps) {
    const [state, { Form }] = useAction(actions.comment);

    const commentId = createMemo<string>(
        // If we're not waiting on a response and we have a result, then reset our id
        previous => (!state.pending && state.result ? crypto.randomUUID() : previous),
        crypto.randomUUID(),
    );

    const comment = createMemo<Comment | undefined>(() => {
        if (state.result) {
            return {
                ...state.result.Comment,
                user: state.result.User,
            };
        } else if (state.input && !state.error) {
            return {
                id: commentId(),
                content: state.input?.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: props.currentUser.name,
                    image: props.currentUser.image,
                },
            };
        }

        return undefined;
    });

    const comments = createMemo<Comment[]>(previous => {
        const haveNewError = !state.pending && state.error;
        if (haveNewError) {
            return previous.filter(comment => comment.id !== commentId());
        }

        const optimisticComment = comment();
        if (optimisticComment) {
            return previous.some(comment => comment.id === optimisticComment.id)
                ? previous.map(comment =>
                      comment.id === optimisticComment.id ? optimisticComment : comment,
                  )
                : [...previous, optimisticComment];
        }

        return previous;
    }, []);

    const [content, setContent] = createSignal("");
    const displayedContent = createMemo(() => {
        const haveNewError = !state.pending && state.error;

        if (haveNewError && state.input) {
            // Get previous content from the optimistic data
            // Because content.value is empty
            return state.input.get("comment") as string;
        }

        return content();
    });

    return (
        <>
            <ul role="list" class="comments">
                {/* Server-rendered comments */}
                {props.children}
                {/* Client-rendered comments */}
                <For each={comments()}>{comment => <CommentPreview comment={comment} />}</For>
            </ul>

            {/* New comment form */}
            <div class="comment-form-container">
                <img src={props.currentUser.image} />
                <Form onSubmit={() => setContent("")}>
                    <input type="hidden" id="postId" name="postId" value={props.postId} />
                    <input type="hidden" id="commentId" name="commentId" value={commentId()} />

                    <div class="text-area-container">
                        <label for="comment" class="sr-only">
                            Add your comment
                        </label>
                        <textarea
                            rows="2"
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value={displayedContent()}
                            onInput={e => setContent(e.target.value)}
                        ></textarea>
                    </div>

                    <div class="button-container">
                        <button type="submit" disabled={state.pending}>
                            Comment
                        </button>
                    </div>
                </Form>
            </div>

            <Show when={state.error}>
                <Alert>{state.error!.message}</Alert>
            </Show>
        </>
    );
}
