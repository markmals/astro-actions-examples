import { effect, State } from ".";
import { BrowserStorageEngine, StorageEngine } from "./storage-engines";

export class PersistedState<T> {
    private state: State<T>;
    private skipSave = true;

    public constructor(
        initialValue: T,
        private key: string,
        private storage: StorageEngine<T> = new BrowserStorageEngine(key),
        options: { signal?: AbortSignal } = {},
    ) {
        this.state = new State(initialValue);
        this.load();

        effect(
            () => {
                let value = this.state.get();
                if (this.skipSave) return;
                try {
                    this.storage.set(this.key, value);
                } catch (err) {
                    // ignore blocked storage access
                }
            },
            { signal: options.signal },
        );

        // if another tab changes the launch tracking state, update our in-memory copy:
        if (typeof addEventListener === "function") {
            addEventListener("storage", event => {
                if (event.key === key) this.load();
            });
        }
    }

    private load() {
        this.skipSave = true;
        try {
            const stored = this.storage.get(this.key);
            if (stored != null) this.state.set(stored);
        } catch (err) {
            // ignore blocked storage access
        }
        this.skipSave = false;
    }

    public get(): T {
        return this.state.get();
    }

    public set(newValue: T) {
        this.state.set(newValue);
    }
}
