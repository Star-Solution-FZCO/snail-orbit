import { useState } from "react";

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

export function useLSState<T>(
    key: string,
    defaultValue: T,
): [T, (value: T) => void];
export function useLSState<T>(
    key: string,
    defaultValue?: undefined,
): [T | undefined, (value: T) => void];
export function useLSState<T>(key: string, defaultValue?: T) {
    const [state, setState] = useState<T | undefined>(
        getFromLS(key) || defaultValue,
    );

    const handleChangeStage = (value: T) => {
        saveToLS(key, value);
        setState(value);
    };

    return [state, handleChangeStage] as const;
}
