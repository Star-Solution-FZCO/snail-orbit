export const cardLabelGetter = <T>(
    option: T | T[] | null,
    labelGetter: (value: T) => string,
) => {
    if (!option) return undefined;
    if (Array.isArray(option)) {
        return option.map(labelGetter);
    } else {
        return labelGetter(option);
    }
};
