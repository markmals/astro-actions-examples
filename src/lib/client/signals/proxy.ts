import { Signal } from "signal-polyfill";
import { State } from ".";

const UNINITIALIZED = Symbol();

type SignalObject = Record<string | symbol, any> & { [Symbol.metadata]: Metadata };

interface Metadata {
    signals: Map<string | symbol, State<any>>;
    version: State<number>;
    isArray: boolean;
}

interface SignalProxyConstructor {
    new <Object extends object>(value: Object): Object;
}

export const SignalProxy = class<Object> {
    constructor(value: Object) {
        if (
            typeof value === "object" &&
            value != null &&
            !Object.isFrozen(value) &&
            !(Symbol.metadata in value)
        ) {
            const prototype = Object.getPrototypeOf(value);

            // TODO: Handle Map and Set as well
            if (prototype === Object.prototype || prototype === Array.prototype) {
                Object.defineProperty(value, Symbol.metadata, {
                    value: {
                        signals: new Map(),
                        version: new State(0),
                        isArray: Array.isArray(value),
                    },
                    writable: false,
                });

                let handler: ProxyHandler<SignalObject> = {
                    defineProperty(target, key, descriptor) {
                        if (descriptor.value) {
                            const metadata = target[Symbol.metadata];

                            const state = metadata.signals.get(key);
                            if (state !== undefined) {
                                state.set(new SignalProxy(descriptor.value));
                            }
                        }

                        return Reflect.defineProperty(target, key, descriptor);
                    },

                    deleteProperty(target, key) {
                        const metadata = target[Symbol.metadata];

                        const state = metadata.signals.get(key);
                        if (state !== undefined) {
                            state.set(UNINITIALIZED);
                        }

                        if (key in target) {
                            const value = metadata.version.get();
                            metadata.version.set(value + 1);
                        }

                        return Reflect.deleteProperty(target, key);
                    },

                    get(target, key, receiver) {
                        const metadata = target[Symbol.metadata];
                        let state = metadata.signals.get(key);

                        // If we're reading a property in a reactive context, create a signal,
                        // but only if it's an own property and not a prototype property
                        if (
                            state === undefined &&
                            Signal.subtle.currentComputed() !== null &&
                            (!(key in target) ||
                                Object.getOwnPropertyDescriptor(target, key)?.writable)
                        ) {
                            state = new State(new SignalProxy(Reflect.get(target, key, receiver)));
                            metadata.signals.set(key, state);
                        }

                        const value =
                            state !== undefined ? state.get() : Reflect.get(target, key, receiver);
                        return value === UNINITIALIZED ? undefined : value;
                    },

                    getOwnPropertyDescriptor(target, key) {
                        const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
                        if (descriptor && "value" in descriptor) {
                            const metadata = target[Symbol.metadata];
                            const state = metadata.signals.get(key);

                            if (state) {
                                descriptor.value = state.get();
                            }
                        }

                        return descriptor;
                    },

                    has(target, key) {
                        if (key === Symbol.metadata) {
                            return true;
                        }
                        const metadata = target[Symbol.metadata];
                        const has = Reflect.has(target, key);

                        let state = metadata.signals.get(key);
                        if (
                            state !== undefined ||
                            // TODO: How to ignore observation here
                            // !ignoredProperties.includes(prop) &&
                            (Signal.subtle.currentComputed() !== null && !has) ||
                            Object.getOwnPropertyDescriptor(target, key)?.writable
                        ) {
                            if (state === undefined) {
                                state = new Signal.State(
                                    has ? new SignalProxy(target[key]) : UNINITIALIZED,
                                );
                                metadata.signals.set(key, state);
                            }
                            const value = state.get();
                            if (value === UNINITIALIZED) {
                                return false;
                            }
                        }
                        return has;
                    },

                    set(target, key, value) {
                        const metadata = target[Symbol.metadata];

                        const state = metadata.signals.get(key);
                        if (state !== undefined) {
                            state.set(new SignalProxy(value));
                        }

                        if (metadata.isArray && key === "length") {
                            for (let i = value; i < target.length; i += 1) {
                                const state = metadata.signals.get(i + "");
                                if (state !== undefined) {
                                    state.set(UNINITIALIZED);
                                }
                            }
                        }

                        if (!(key in target)) {
                            const value = metadata.version.get();
                            metadata.version.set(value + 1);
                        }

                        Reflect.set(target, key, value);

                        return true;
                    },

                    ownKeys(target) {
                        const metadata = target[Symbol.metadata];
                        metadata.version.get();
                        return Reflect.ownKeys(target);
                    },
                };

                return new Proxy(value, handler as ProxyHandler<Object & object>);
            }
        }

        return value as any;
    }
} as SignalProxyConstructor;
