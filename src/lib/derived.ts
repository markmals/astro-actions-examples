export function derived<T>(value: T, fn: (v: T) => T): () => T {
    return () => (value = fn(value));
}
