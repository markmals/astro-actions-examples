import { Signal } from "signal-polyfill";

let needsEnqueue = true;

const watcher = new Signal.subtle.Watcher(() => {
    if (needsEnqueue) {
        needsEnqueue = false;
        queueMicrotask(processPending);
    }
});

function processPending() {
    needsEnqueue = true;

    for (const signal of watcher.getPending()) {
        signal.get();
    }

    watcher.watch();
}

export function effect(
    callback: () => void | (() => void),
    options?: { signal?: AbortSignal },
): void {
    let cleanup: (() => void) | void | undefined;

    const computed = new Signal.Computed(() => {
        typeof cleanup === "function" && cleanup();
        cleanup = callback();
    });

    watcher.watch(computed);
    computed.get();

    options?.signal?.addEventListener(
        "abort",
        () => {
            watcher.unwatch(computed);
            typeof cleanup === "function" && cleanup();
            cleanup = undefined;
        },
        { once: true },
    );
}
