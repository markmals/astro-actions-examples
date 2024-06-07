import { actions } from "astro:actions";
import { useAction } from "../lib/solid-actions";
import {
    For,
    Show,
    createEffect,
    createMemo,
    createSignal,
    untrack,
    type ParentProps,
} from "solid-js";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { createStore, produce } from "solid-js/store";
import { Alert } from "./Alert";

export interface CommentFormProps extends ParentProps {
    currentUser: HydratedPost["user"];
    postId: number;
}

function createUUIDStore() {
    const [id, setId] = createSignal(crypto.randomUUID());

    return {
        get id() {
            return id();
        },
        regenerate() {
            setId(crypto.randomUUID());
        },
    };
}

export function CommentForm(props: CommentFormProps) {
    const [comment, { Form }] = useAction(actions.comment);
    const [cachedComments, setCachedComments] = createStore<Record<string, Comment>>({});
    const [content, setContent] = createSignal("");

    const tempCommentIdStore = createUUIDStore();

    const newComment = createMemo<Comment | undefined>(() => {
        if (comment.result) {
            return {
                ...comment.result.Comment,
                user: comment.result.User,
            };
        } else if (comment.input && !comment.error) {
            return {
                id: tempCommentIdStore.id,
                content: comment.input.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: props.currentUser.name,
                    image: props.currentUser.image,
                },
            };
        }

        return undefined;
    });

    createEffect(() => {
        const c = newComment();

        if (c) {
            setCachedComments(
                produce(cache => {
                    cache[c.id] = c;
                }),
            );
        }
    });

    createEffect(() => {
        if (!comment.pending) {
            if (comment.error && comment.input) {
                const commentContent = comment.input.get("comment") as string;

                setCachedComments(
                    produce(cache => {
                        delete cache[untrack(() => tempCommentIdStore.id)];
                    }),
                );

                setContent(commentContent);
                tempCommentIdStore.regenerate();
            } else if (comment.result) {
                tempCommentIdStore.regenerate();
            }
        }
    });

    return (
        <>
            <ul role="list" class="comments">
                {props.children}
                <For each={Array.from(Object.entries(cachedComments))}>
                    {([_, comment]) => <CommentPreview comment={comment} />}
                </For>
            </ul>

            {/* New comment form */}
            <div class="comment-form-container">
                <img src={props.currentUser.image} />
                <Form onSubmit={() => setContent("")}>
                    <input type="hidden" id="postId" name="postId" value={props.postId} />
                    <input
                        type="hidden"
                        id="commentId"
                        name="commentId"
                        value={tempCommentIdStore.id}
                    />

                    <div class="text-area-container">
                        <label for="comment" class="sr-only">
                            Add your comment
                        </label>
                        <textarea
                            rows="2"
                            name="comment"
                            id="comment"
                            placeholder="Add your comment..."
                            value={content()}
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
