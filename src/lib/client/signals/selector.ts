import { effect, State } from ".";

// TODO: Make sure this is actually O(1) instead of O(n)

/**
 * Creates a conditional signal that only notifies subscribers when entering or
 * exiting their key matching the value. Useful for delegated selection state,
 * as it makes the operation O(1) instead of O(n).
 */
export class Selector<T> {
    private subscriptions = new Map<T, State<T | undefined | null>>();
    private source: State<T>;
    private value!: T;
    private equals: (a: T, b: T) => boolean;

    constructor(
        initialValue: T,
        options: { signal?: AbortSignal; equals: (a: T, b: T) => boolean } = {
            equals: (a, b) => a === b,
        },
    ) {
        this.value = initialValue;
        this.source = new State<T>(this.value);
        this.equals = options.equals;

        effect(
            () => {
                this.value = this.source.get();

                for (const key of [...this.subscriptions.keys()]) {
                    const o = this.subscriptions.get(key);
                    o?.set(options.equals(key, this.value) ? (this.value as T) : null);
                }
            },
            { signal: options.signal },
        );
    }

    public isSelected(key: T) {
        type Tracker = State<T | undefined | null> & { _count?: number };
        let tracker = this.subscriptions.get(key) as Tracker;

        if (!tracker) {
            tracker = new State(undefined) as any;
            this.subscriptions.set(key, tracker);
        }

        tracker.get();

        if (tracker._count) {
            tracker._count++;
        } else {
            tracker._count = 1;
        }

        if (tracker._count > 1) {
            tracker._count--;
        }

        return this.equals(key, this.value);
    }

    public set(newValue: T) {
        this.source.set(newValue);
    }
}

// import { mapArray } from ".";

// const list = new State<{ id: number; name: string }[]>([]);
// const selected = new Selector<number | null>(null);

// const elements = mapArray(
//     () => list.get(),
//     item => {
//         return {
//             tag: "li",
//             class: () => (selected.isSelected(item.id) ? "active" : ""),
//             onClick: () => selected.set(item.id),
//             children: item.name,
//         };
//     },
// );
