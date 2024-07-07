import { Computed, State, untrack } from ".";

/**
 * Reactively transforms an array with a callback function
 *
 * Similar to `Array.prototype.map`, but gets the index as a signal, transforms only values that changed and returns a computed signal and reactively tracks changes to the array.
 */
export function mapArray<Item, Result>(
    array: () => Item[],
    transform: (value: Item, index: Computed<number>) => Result,
): Computed<Result[]> {
    let items: Item[] = [];
    let mapped: Result[] = [];
    let len = 0;
    let indexes: ((v: number) => number)[] | null = transform.length > 1 ? [] : null;

    return new Computed(() => {
        let newItems = array() || [];
        let i: number;
        let j: number;
        //   (newItems as any)[$TRACK] // top level tracking
        return untrack(() => {
            let newLen = newItems.length,
                newIndices: Map<Item, number>,
                newIndicesNext: number[],
                temp: Result[],
                tempIndexes: ((v: number) => number)[],
                start: number,
                end: number,
                newEnd: number,
                item: Item;

            // fast path for empty arrays
            if (newLen === 0) {
                if (len !== 0) {
                    items = [];
                    mapped = [];
                    len = 0;
                    indexes && (indexes = []);
                }
                //   if (options.fallback) {
                //       items = [FALLBACK]
                //       mapped[0] = createRoot(disposer => {
                //           return options.fallback!()
                //       })
                //       len = 1
                //   }
            }
            // fast path for new create
            else if (len === 0) {
                mapped = new Array(newLen);
                for (j = 0; j < newLen; j++) {
                    items[j] = newItems[j];
                    mapped[j] = mapper();
                }
                len = newLen;
            } else {
                temp = new Array(newLen);
                indexes && (tempIndexes = new Array(newLen));

                // skip common prefix
                for (
                    start = 0, end = Math.min(len, newLen);
                    start < end && items[start] === newItems[start];
                    start++
                );

                // common suffix
                for (
                    end = len - 1, newEnd = newLen - 1;
                    end >= start && newEnd >= start && items[end] === newItems[newEnd];
                    end--, newEnd--
                ) {
                    temp[newEnd] = mapped[end];
                    indexes && (tempIndexes![newEnd] = indexes[end]);
                }

                // 0) prepare a map of all indices in newItems, scanning backwards so we encounter them in natural order
                newIndices = new Map<Item, number>();
                newIndicesNext = new Array(newEnd + 1);
                for (j = newEnd; j >= start; j--) {
                    item = newItems[j];
                    i = newIndices.get(item)!;
                    newIndicesNext[j] = i === undefined ? -1 : i;
                    newIndices.set(item, j);
                }
                // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
                for (i = start; i <= end; i++) {
                    item = items[i];
                    j = newIndices.get(item)!;
                    if (j !== undefined && j !== -1) {
                        temp[j] = mapped[i];
                        indexes && (tempIndexes![j] = indexes[i]);
                        j = newIndicesNext[j];
                        newIndices.set(item, j);
                    }
                }
                // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
                for (j = start; j < newLen; j++) {
                    if (j in temp) {
                        mapped[j] = temp[j];
                        if (indexes) {
                            indexes[j] = tempIndexes![j];
                            indexes[j](j);
                        }
                    } else mapped[j] = mapper();
                }
                // 3) in case the new set is shorter than the old, set the length of the mapped array
                mapped = mapped.slice(0, (len = newLen));
                // 4) save a copy of the mapped items for the next update
                items = newItems.slice(0);
            }
            return mapped;
        });

        function mapper() {
            if (indexes) {
                const s = new State(j);
                const set = (v: number) => {
                    s.set(v);
                    return v;
                };
                indexes[j] = set;
                let computed = new Computed(() => s.get());
                return transform(newItems[j], computed);
            }

            return (transform as any)(newItems[j]);
        }
    });
}
