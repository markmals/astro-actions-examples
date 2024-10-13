import { useMemo, useRef } from 'react';

export function useDerived<T>(fn: (v?: T) => T): T;
export function useDerived<T>(initialValue: T, fn: (v: T) => T): T;
export function useDerived<T>(initialValueOrFn: T | ((v?: T) => T), fn?: (v: T) => T): T {
    const valueRef = useRef<T | undefined>(
        typeof initialValueOrFn !== 'function' ? initialValueOrFn : undefined,
    );

    const actualFn = (typeof initialValueOrFn === 'function' ? initialValueOrFn : fn) as (
        v?: T,
    ) => T;

    return useMemo(() => {
        valueRef.current = actualFn(valueRef.current);
        return valueRef.current as T;
    }, [actualFn]);
}
