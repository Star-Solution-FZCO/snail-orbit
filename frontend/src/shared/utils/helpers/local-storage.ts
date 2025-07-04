import { useCallback, useState } from "react";

export const saveToLS = <T>(key: string, value: T): void => {
    const packedValue = { value };
    localStorage.setItem(key, JSON.stringify(packedValue));
};

export const getFromLS = <T>(key: string): T | null => {
    const packedValue = localStorage.getItem(key);
    if (!packedValue) return null;
    try {
        return JSON.parse(packedValue).value;
    } catch {
        return null;
    }
};

type Setter<T> = T | ((prevState: T) => T);

const isFunction = <T>(value: Setter<T>): value is (prevState: T) => T => {
    return typeof value === "function";
};

export function useLSState<T>(
    key: string,
    defaultValue: T,
): [T, (value: Setter<T>) => void];
export function useLSState<T>(
    key: string,
    defaultValue?: undefined,
): [T | undefined, (value: Setter<T>) => void];
export function useLSState<T>(key: string, defaultValue?: T) {
    const [state, setState] = useState<T | undefined>(
        getFromLS(key) || defaultValue,
    );

    const handleChangeStage = useCallback(
        (value: Setter<T>) => {
            setState((prev) => {
                const newValue = isFunction(value) ? value(prev as T) : value;
                saveToLS(key, newValue);
                return newValue;
            });
        },
        [key],
    );

    return [state, handleChangeStage] as const;
}
