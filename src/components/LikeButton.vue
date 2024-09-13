<script lang="ts">
export interface Props {
    postId: number;
    likeCount: number;
    isLiked: boolean;
}
</script>

<script setup lang="ts">
import { useAction } from '../lib/action';
import { actions } from 'astro:actions';
import { derived } from '../lib/derived';
import { computed, ref } from 'vue';

const props = defineProps<Props>();

const likes = useAction(actions.like);
const isLiked = ref(props.isLiked);

const result = derived(props.likeCount, (previous) => (likes.result ? likes.result : previous));

// Optimistic UI
const likeCount = computed(() => {
    if (likes.pending) {
        // By this time we've set isLiked to its optimistic value
        return isLiked.value ? result.value + 1 : result.value - 1;
    }
    return result.value;
});

async function clickLikeButton() {
    isLiked.value = !isLiked.value;
    await likes.submit({ postId: props.postId });

    if (likes.error) {
        isLiked.value = !isLiked.value;
    }
}
</script>

<template>
    <span>{{ likeCount }}</span>
    <button :disabled="likes.pending" @click="clickLikeButton()">
        <template v-if="isLiked">♥︎</template>
        <template v-else>♡</template>
    </button>
</template>

<style scoped>
span {
    font-size: var(--font-size-sm);
    line-height: var(--font-size-sm--line-height);
}

button {
    color: var(--color-red-500);
}

button:disabled {
    opacity: 50%;
}
</style>
