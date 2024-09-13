<template>
    <div class="alert">
        <div class="icons">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clip-rule="evenodd"
                ></path>
            </svg>
        </div>
        <h3><slot></slot></h3>
    </div>
</template>

<style scoped>
.alert {
    margin-left: 2.125rem;
    border-radius: var(--radius-md);
    background-color: var(--color-red-50);
    padding: var(--spacing-4);
    display: flex;
    align-items: center;
}

.icons {
    flex-shrink: 0;
}

svg {
    height: var(--spacing-5);
    width: var(--spacing-5);
    color: var(--color-red-400);
}

h3 {
    margin-left: var(--spacing-3);
    font-size: var(--font-size-xs);
    line-height: var(--font-size-sm--line-height);
    color: var(--color-red-800);
}
</style>
