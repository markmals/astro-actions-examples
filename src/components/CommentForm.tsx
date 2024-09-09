import { actions } from "astro:actions";
import { useAction } from "../lib/solid-actions";
import { For, Show, createMemo, createSignal, untrack } from "solid-js";
import type { ParentProps } from "solid-js";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { Alert } from "./Alert";

export interface CommentFormProps extends ParentProps {
    currentUser: HydratedPost["user"];
    postId: number;
}

function removeDuplicates<T, U>({ by: predicate }: { by: (value: T) => U }, array: T[]) {
    const uniqueKeys = new Set();
    return array.filter(x => {
        const key = predicate(x);
        const isUnique = !uniqueKeys.has(key);
        uniqueKeys.add(key);
        return isUnique;
    });
}

export function CommentForm(props: CommentFormProps) {
    const [comment, { Form }] = useAction(actions.comment);

    const tempId = createMemo<string>(previous => {
        // We're not waiting on a response and we have an error or a result
        if (!comment.pending && (comment.error || comment.result)) {
            // Reset our UUID
            return crypto.randomUUID();
        }

        return previous;
    }, crypto.randomUUID());

    const newComment = createMemo<Comment | undefined>(() => {
        if (comment.result) {
            return {
                ...comment.result.Comment,
                user: comment.result.User,
            };
        } else if (comment.input && !comment.error) {
            return {
                id: tempId(),
                content: comment.input?.get("comment") as string,
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
        const haveNewError = !comment.pending && comment.error;

        if (haveNewError) {
            return previous.slice(0, -1);
        }

        const c = newComment();
        if (c) return removeDuplicates({ by: comment => comment.id }, [...previous, c]);

        return previous;
    }, []);

    const [content, setContent] = createSignal("");
    const displayedContent = createMemo(() => {
        const haveNewError = !comment.pending && comment.error;

        if (haveNewError && comment.input) {
            // Get previous content from the optimistic data
            // Because content.value is empty
            return comment.input.get("comment") as string;
        }

        return content();
    });

    return (
        <>
            <ul role="list" class="comments">
                {props.children}
                <For each={comments()}>{comment => <CommentPreview comment={comment} />}</For>
            </ul>

            {/* New comment form */}
            <div class="comment-form-container">
                <img src={props.currentUser.image} />
                <Form onSubmit={() => setContent("")}>
                    <input type="hidden" id="postId" name="postId" value={props.postId} />
                    <input type="hidden" id="commentId" name="commentId" value={tempId()} />

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
                        <button type="submit" disabled={comment.pending}>
                            Comment
                        </button>
                    </div>
                </Form>
            </div>

            <Show when={comment.error}>
                <Alert>{comment.error!.message}</Alert>
            </Show>
        </>
    );
}
