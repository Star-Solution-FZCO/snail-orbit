import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

const useDebouncedState = <T>(
    initialValue: T,
    delay = 300,
): [T, Dispatch<SetStateAction<T>>, T] => {
    const [value, setValue] = useState(initialValue);
    const [debouncedValue, setDebouncedValue] = useState(initialValue);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [delay, value]);

    return [debouncedValue, setValue, value];
};

export default useDebouncedState;
