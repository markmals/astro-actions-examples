import { effect } from "../signals";

interface EventListener<Event> {
    (event: Event): Promise<void> | void;
}

export abstract class ReactiveElement extends HTMLElement {
    protected disconnect = new AbortController();

    protected hydrateListener<Type extends keyof HTMLElementEventMap>(
        target: EventTarget,
        type: Type,
        listener: EventListener<HTMLElementEventMap[Type]>,
    ) {
        target.addEventListener(type, listener as any, { signal: this.disconnect.signal });
    }

    protected renderEffect(callback: () => void) {
        effect(callback, { signal: this.disconnect.signal });
    }

    public disconnectedCallback() {
        this.disconnect.abort();
    }
}
