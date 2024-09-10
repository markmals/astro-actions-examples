import { useState, useEffect, useRef } from "react";

export function useDerived<T>(deriveFn: (prevValue: T) => T, initialValue: T): T {
    const [value, setValue] = useState<T>(initialValue);
    const prevValueRef = useRef<T>(initialValue);

    useEffect(() => {
        const derivedValue = deriveFn(prevValueRef.current);
        setValue(derivedValue);
        prevValueRef.current = derivedValue; // Update the previous value
    }, [deriveFn]);

    return value;
}
