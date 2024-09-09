import { signal, computed } from "@preact/signals";
import { useMemo } from "preact/hooks";

class UUIDStore {
    #id = signal(crypto.randomUUID());
    id = computed(() => this.#id.value);
    regenerate() {
        this.#id.value = crypto.randomUUID();
    }
}

export function useUUIDStore() {
    return useMemo(() => new UUIDStore(), []);
}

export type { UUIDStore };
