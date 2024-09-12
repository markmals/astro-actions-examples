export type Accessor<T> = () => T;

export type EffectFunction<Prev, Next extends Prev = Prev> = (v: Prev) => Next;

export function deriveFrom<Next extends Prev, Init extends Next = Next, Prev = Next>(
    value: Init,
    fn: EffectFunction<Init | Prev, Next>,
): Accessor<Next> {
    let tmp: Prev = value;
    let backing = $derived((tmp = fn(tmp)));
    return () => backing as Next;
}
