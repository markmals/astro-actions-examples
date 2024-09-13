<script lang="ts">
import type { HydratedPost } from '../lib/fetchAllPosts';

export interface Props {
    currentUser: HydratedPost['user'];
    postId: number;
    commentId: ReturnType<typeof crypto.randomUUID>;
    error?: ActionError<any>;
}
</script>

<script setup lang="ts">
import { ActionError, actions } from 'astro:actions';
import { useAction, vEnhance } from '../lib/action';
import { ref, computed } from 'vue';
import { derived } from '../lib/derived';
import CommentPreview from './CommentPreview.vue';
import { type Comment } from './CommentPreview.vue';
import Alert from './Alert.vue';

const {
    currentUser,
    postId,
    commentId: initialCommentId,
    error: serverError,
} = defineProps<Props>();

const commentAction = useAction(actions.comment);

const commentId = derived(
    initialCommentId,
    // If we're not waiting on a response and we have a result, then reset our id
    (previous) => (!commentAction.pending && commentAction.result ? crypto.randomUUID() : previous),
);

const comment = computed<Comment | undefined>(() => {
    if (commentAction.result) {
        return {
            ...commentAction.result.Comment,
            user: commentAction.result.User,
        };
    } else if (commentAction.input && !commentAction.error) {
        return {
            id: commentId.value,
            content: commentAction.input.get('comment') as string,
            createdOn: new Date(),
            user: {
                name: currentUser.name,
                image: currentUser.image,
            },
        };
    }

    return undefined;
});

const comments = derived<Comment[]>([], (previous) => {
    const haveNewError = !commentAction.pending && !!commentAction.error;
    if (haveNewError) {
        return previous.filter((comment) => comment.id !== commentId.value);
    }

    if (comment.value) {
        return previous.some((c) => c.id === comment.value.id)
            ? previous.map((c) => (c.id === comment.value.id ? comment.value : c))
            : [...previous, comment.value];
    }

    return previous;
});

const content = ref('');
const displayedContent = computed(() => {
    const haveNewError = !commentAction.pending && !!commentAction.error;

    if (haveNewError && commentAction.input) {
        // Get previous content from the optimistic data
        // Because content.value is empty
        return commentAction.input.get('comment') as string;
    }

    return content.value;
});

function handleInput(event: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
    content.value = event.currentTarget.value;
}

function handleKeydown(
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement },
) {
    const isApple = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
    const pressedModifier = isApple ? event.metaKey : event.ctrlKey;
    const pressedEnter = event.key === 'Enter';

    if (pressedModifier && pressedEnter) {
        event.preventDefault();
        event.currentTarget.form?.dispatchEvent(
            new SubmitEvent('submit', {
                bubbles: true,
                cancelable: true,
            }),
        );
    }
}

const error = computed(() =>
    (commentAction.error?.message ?? serverError?.message)?.split(':')[1].trim(),
);
</script>

<template>
    <slot></slot>

    <ul v-if="comments.length !== 0" role="list" class="comment-feed">
        <CommentPreview v-for="comment in comments" :comment="comment" />
    </ul>

    <!-- New comment form -->
    <div class="form-container">
        <img :src="currentUser.image" />
        <form v-enhance="commentAction" @submit="content = ''">
            <input type="hidden" id="postId" name="postId" :value="postId" />
            <input type="hidden" id="commentId" name="commentId" :value="commentId" />

            <div class="content">
                <label for="comment" class="sr-only">Add your comment</label>
                <textarea
                    rows="2"
                    name="comment"
                    id="comment"
                    placeholder="Add your comment..."
                    :value="displayedContent"
                    @input="handleInput($event as any)"
                    @keydown="handleKeydown($event as any)"
                ></textarea>
            </div>

            <div class="button">
                <button type="submit" :disabled="commentAction.pending">Comment</button>
            </div>
        </form>
    </div>

    <Alert v-if="error">{{ error }}</Alert>
</template>

<style>
ul.comment-feed > * + * {
    margin-top: var(--spacing-6);
}

ul.comment-feed > astro-slot > comment-feed > * + * {
    margin-top: var(--spacing-6);
}
</style>

<style scoped>
ul {
    margin-top: var(--spacing-6);
    margin-bottom: var(--spacing-6);
}

.form-container {
    margin-bottom: var(--spacing-3);
    margin-top: var(--spacing-6);
    display: flex;
    column-gap: var(--spacing-3);
}

img {
    height: var(--spacing-6);
    width: var(--spacing-6);
    flex: none;
    border-radius: var(--radius-full);
    background-color: var(--color-gray-50);
}

form {
    position: relative;
    flex: 1 1 auto;
}

.content {
    overflow: hidden;
    border-radius: var(--radius-lg);
    padding-bottom: var(--spacing-12);

    box-shadow:
        var(--ring-offset-shadow),
        inset 0 0 0 1px var(--color-gray-300),
        var(--shadow-sm);
}

textarea {
    display: block;
    width: 100%;
    resize: none;
    border-width: var(--spacing-0);
    background-color: transparent;
    padding-top: var(--spacing-1_5);
    padding-bottom: var(--spacing-1_5);
    color: var(--color-gray-900);
}

@media (min-width: 640px) {
    textarea {
        font-size: var(--font-size-sm);
        line-height: var(--line-height-6);
    }
}

textarea::placeholder {
    color: var(--color-gray-400);
}

.button {
    position: absolute;

    left: 0px;
    right: 0px;
    bottom: 0px;

    display: flex;
    justify-content: end;

    padding-top: var(--spacing-2);
    padding-bottom: var(--spacing-2);
    padding-left: var(--spacing-3);
    padding-right: var(--spacing-2);
}

button {
    border-radius: var(--radius-md);
    background-color: var(--spacing-4);
    padding: var(--spacing-1_5) var(--spacing-2_5);
    font-size: var(--font-size-sm);
    line-height: var(--font-size-sm--line-height);
    font-weight: 600;
    color: var(--color-gray-900);

    box-shadow:
        var(--ring-offset-shadow),
        inset 0 0 0 1px var(--color-gray-300),
        var(--shadow-sm);
}

button:hover {
    background-color: var(--color-gray-50);
}

button:disabled {
    background-color: var(--color-gray-200);
    color: var(--color-gray-600);
    box-shadow: 0 0 #0000;
}

button:hover:disabled {
    background-color: var(--color-gray-200);
}
</style>
