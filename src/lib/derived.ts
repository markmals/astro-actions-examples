import { computed, type ComputedRef } from 'vue';

export function derived<T>(value: T, fn: (v: T) => T): ComputedRef<T> {
    return computed(() => (value = fn(value)));
}
