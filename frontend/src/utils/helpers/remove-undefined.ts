export const removeUndefined = <T extends object>(
    obj: Partial<T>,
): Partial<T> => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined),
    ) as Partial<T>;
};
