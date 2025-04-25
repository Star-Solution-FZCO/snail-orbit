export const makeFalsyUndefined = <T extends object>(obj: T): T => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
            key,
            !value ? undefined : value,
        ]),
    ) as T;
};
