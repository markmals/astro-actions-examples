<script lang="ts">
export interface Comment {
    id: string;
    content: string;
    createdOn: Date | string;
    user: {
        name: string;
        image: string;
    };
}

export interface Props {
    comment: Comment;
}
</script>

<script setup lang="ts">
import { formatters } from '../lib/formatters';
const { comment } = defineProps<Props>();
</script>

<template>
    <li>
        <div class="line-container">
            <div class="line"></div>
        </div>

        <img :src="comment.user.image" />

        <div class="content">
            <div>
                <div class="user-name">
                    <span>{{ comment.user.name }}</span> commented
                </div>
                <time :datetime="formatters.comment.formatAsISO(comment.createdOn)">
                    {{ formatters.comment.formatForDisplay(comment.createdOn) }}
                </time>
            </div>
            <p>{{ comment.content }}</p>
        </div>
    </li>
</template>

<style scoped>
li {
    position: relative;
    display: flex;
    column-gap: var(--spacing-4);
}

.line-container {
    position: absolute;
    bottom: -1.5rem;
    left: var(--spacing-0);
    top: var(--spacing-0);
    margin-top: var(--spacing-3);
    display: flex;
    width: var(--spacing-6);
    justify-content: center;
}

.line {
    width: var(--spacing-px);
    background-color: var(--color-gray-200);
}

img {
    position: relative;
    margin-top: var(--spacing-3);
    height: var(--spacing-6);
    width: var(--spacing-6);
    flex: none;
    border-radius: var(--radius-full);
    background-color: var(--color-gray-50);
}

.content {
    flex: 1 1 auto;
    border-radius: var(--radius-md);
    padding: var(--spacing-3);
    box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-sm);
}

.content > div {
    display: flex;
    justify-content: space-between;
    column-gap: var(--spacing-4);
}

.user-name {
    padding-top: var(--spacing-0_5);
    padding-bottom: var(--spacing-0_5);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-5);
}

span {
    font-weight: 500;
    color: var(--color-gray-900);
}

time {
    flex: none;
    padding-top: var(--spacing-0_5);
    padding-bottom: var(--spacing-0_5);
    font-size: var(--font-size-xs);
    line-height: var(--line-height-5);
    color: var(--color-gray-500);
}

p {
    font-size: var(--font-size-xs);
    line-height: var(--line-height-6);
    color: var(--color-gray-500);
}
</style>
