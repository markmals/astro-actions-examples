import { actions } from "astro:actions";
import { useAction } from "../lib/solid-actions";
import { For, Show, createEffect, createMemo, createSignal, type ParentProps } from "solid-js";
import type { HydratedPost } from "../lib/fetchAllPosts";
import { CommentPreview, type Comment } from "./CommentPreview";
import { createStore, produce } from "solid-js/store";
import { Alert } from "./Alert";

export interface CommentFormProps extends ParentProps {
    currentUser: HydratedPost["user"];
    postId: number;
}

export function CommentForm(props: CommentFormProps) {
    const [comment, { Form }] = useAction(actions.comment);
    const [cachedComments, setCachedComments] = createStore<Record<string, Comment>>({});
    const [content, setContent] = createSignal("");

    const newComment = createMemo<Comment | undefined>(() => {
        if (comment.result) {
            return {
                ...comment.result.Comment,
                user: comment.result.User,
            };
        } else if (comment.input) {
            return {
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
                    // TODO: figure out how to de-dupe these better for optimistic UI
                    // on the client, since the actual keys are generated on the server
                    cache[c.content] = c;
                }),
            );
        }
    });

    createEffect(() => {
        if (comment.error && comment.input) {
            const commentContent = comment.input.get("comment") as string;

            setCachedComments(
                produce(cache => {
                    delete cache[commentContent];
                }),
            );

            setContent(commentContent);
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
                <Alert>
                    {/* TODO: Figure out how to intercept the actual error message */}
                    {comment.error!.message}
                </Alert>
            </Show>
        </>
    );
}
