import { actions } from "astro:actions";
import { useAction } from "../lib/actions";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { Alert } from "./Alert";
import {
    computed,
    signal,
    untracked,
    useComputed,
    useSignal,
    useSignalEffect,
    type ReadonlySignal,
} from "@preact/signals";
import { useMemo } from "preact/hooks";
import type { PropsWithChildren } from "preact/compat";
import { Show } from "./control-flow/Show";
import { For } from "./control-flow/For";
import { useUUIDStore } from "../lib/uuid-store";

export interface CommentFormProps extends PropsWithChildren {
    currentUser: HydratedPost["user"];
    postId: number;
}

function useSignalMemo<T>(initialValue: T, callback: (prev: T) => T): ReadonlySignal<T> {
    const memo = useSignal(initialValue);

    useSignalEffect(() => {
        memo.value = callback(memo.value);
    });

    return useComputed(() => memo.value);
}

export function CommentForm({ children, currentUser, postId }: CommentFormProps) {
    const { Form, ...comment } = useAction(actions.comment);

    const content = useSignal("");

    const tempId = useSignalMemo(crypto.randomUUID(), previous => {
        // We're not waiting on a response and we have an error or a result
        if (!comment.pending.value && (comment.error.value || comment.result.value)) {
            // Reset our UUID
            return crypto.randomUUID();
        }

        return previous;
    });

    const newComment = useComputed<Comment | undefined>(() => {
        if (comment.result.value) {
            return {
                ...comment.result.value.Comment,
                user: comment.result.value.User,
            };
        } else if (comment.input && !comment.error) {
            return {
                id: tempId.value,
                content: comment.input.value?.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: currentUser.name,
                    image: currentUser.image,
                },
            };
        }

        return undefined;
    });

    const displayedComments = useSignalMemo<Comment[]>([], previous => {
        const haveNewError = !comment.pending.value && comment.error.value;

        if (haveNewError) {
            return previous
                .filter(comment => comment.id !== untracked(() => tempId.value))
                .map(comment => comment);
        }

        if (newComment.value) {
            return [...previous, newComment.value];
        }

        return previous;
    });

    const displayedContent = useComputed(() => {
        const haveNewError = !comment.pending.value && comment.error.value;

        if (haveNewError && comment.input.value) {
            // Get previous content from the optimistic data
            // Because content.value is empty
            return comment.input.value.get("comment") as string;
        }

        return content.value;
    });

    return (
        <>
            <ul role="list" class="comments">
                {children}
                <For each={displayedComments}>
                    {comment => <CommentPreview comment={comment} />}
                </For>
            </ul>

            {/* New comment form */}
            <div class="comment-form-container">
                <img src={currentUser.image} />
                <Form onSubmit={() => (content.value = "")}>
                    <input type="hidden" id="postId" name="postId" value={postId} />
                    <input type="hidden" id="commentId" name="commentId" value={tempId} />

                    <div class="text-area-container">
                        <label for="comment" class="sr-only">
                            Add your comment
                        </label>
                        <textarea
                            rows={2}
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value={displayedContent}
                            onInput={e => (content.value = (e.target as HTMLTextAreaElement).value)}
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
                <Alert>{comment.error.value?.message}</Alert>
            </Show>
        </>
    );
}
