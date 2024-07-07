import { State } from ".";

export class UUIDStore {
    #id = new State(crypto.randomUUID());

    public get id() {
        return this.#id.get();
    }

    public regenerate() {
        this.#id.set(crypto.randomUUID());
    }
}
