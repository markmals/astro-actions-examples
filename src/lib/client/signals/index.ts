// export { SignalMap } from "signal-utils/map";
// export { arrayMap } from "signal-utils/array-map";

export * from "./action";
export * from "./effect";
export * from "./array";
export * from "./selector";
export * from "./uuid-store";

import { Signal } from "signal-polyfill";

export const State = Signal.State;
export type State<T> = Signal.State<T>;

export const Computed = Signal.Computed;
export type Computed<T> = Signal.Computed<T>;

export const untrack = Signal.subtle.untrack;
