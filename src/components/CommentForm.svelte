<script module lang="ts">
    import type { Snippet } from "svelte";
    import type { HydratedPost } from "../lib/fetchAllPosts";

    export interface Props {
        currentUser: HydratedPost["user"];
        postId: number;
        children: Snippet;
    }
</script>

<script lang="ts">
    import { actions } from "astro:actions";
    import { Action } from "../lib/actions.svelte";
    import CommentPreview from "./CommentPreview.svelte";
    import { type Comment } from "./CommentPreview.svelte";
    import Alert from "./Alert.svelte";
    import { deriveFrom } from "../lib/derive-from.svelte";
    import Form from "../lib/Form.svelte";

    const { currentUser, postId, children }: Props = $props();

    const action = new Action(actions.comment);

    const commentId = deriveFrom<string>(
        crypto.randomUUID(),
        // If we're not waiting on a response and we have a result, then reset our id
        previous => (!action.pending && action.result ? crypto.randomUUID() : previous),
    );

    const comment = $derived.by<Comment | undefined>(() => {
        if (action.result) {
            return {
                ...action.result.Comment,
                user: action.result.User,
            };
        } else if (action.input && !action.error) {
            return {
                id: commentId(),
                content: action.input.get("comment") as string,
                createdOn: new Date(),
                user: {
                    name: currentUser.name,
                    image: currentUser.image,
                },
            };
        }

        return undefined;
    });

    const comments = deriveFrom<Comment[]>([], previous => {
        const haveNewError = !action.pending && action.error;
        if (haveNewError) {
            return previous.filter(comment => comment.id !== commentId());
        }

        if (comment) {
            return previous.some(c => c.id === comment.id)
                ? previous.map(c => (c.id === comment.id ? comment : c))
                : [...previous, comment];
        }

        return previous;
    });

    let content = $state("");

    const displayedContent = $derived.by(() => {
        const haveNewError = !action.pending && action.error;

        if (haveNewError && action.input) {
            // Get previous content from the optimistic data
            // Because content.value is empty
            return action.input.get("comment") as string;
        }

        return content;
    });

    function handleKeydown(
        event: KeyboardEvent & {
            currentTarget: EventTarget & HTMLTextAreaElement;
        },
    ) {
        const isApple = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
        const pressedModifier = isApple ? event.metaKey : event.ctrlKey;
        const pressedEnter = event.key === "Enter";

        if (pressedModifier && pressedEnter) {
            event.preventDefault();
            event.currentTarget.form?.dispatchEvent(
                new SubmitEvent("submit", {
                    bubbles: true,
                    cancelable: true,
                }),
            );
        }
    }
</script>

<ul role="list" class="comments">
    <!-- Server-rendered comments -->
    {@render children()}
    <!-- Client-rendered comments -->
    {#each comments() as comment}
        <CommentPreview {comment} />
    {/each}
</ul>

<!-- New comment form -->
<div class="comment-form-container">
    <!-- svelte-ignore a11y_missing_attribute -->
    <img src={currentUser.image} />
    <Form
        {action}
        onsubmit={() => {
            content = "";
        }}
    >
        <input type="hidden" id="postId" name="postId" value={postId} />
        <input type="hidden" id="commentId" name="commentId" value={commentId()} />

        <div class="text-area-container">
            <label for="comment" class="sr-only"> Add your comment </label>
            <textarea
                rows="2"
                name="comment"
                id="comment"
                placeholder="Add your comment..."
                value={displayedContent}
                oninput={event => (content = event.currentTarget.value)}
                onkeydown={handleKeydown}
            ></textarea>
        </div>

        <div class="button-container">
            <button type="submit" disabled={action.pending}>Comment</button>
        </div>
    </Form>
</div>

{#if action.error}
    <Alert>{action.error.message}</Alert>
{/if}
