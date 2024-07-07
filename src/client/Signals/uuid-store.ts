import { Signal } from "signal-polyfill";

export class UUIDStore {
    #id = new Signal.State(crypto.randomUUID());

    public get id() {
        return this.#id.get();
    }

    public regenerate() {
        this.#id.set(crypto.randomUUID());
    }
}
