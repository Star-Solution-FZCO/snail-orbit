import { UniqueIdentifier } from "@dnd-kit/core";

export const fieldValueToKey = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return "__NULL__";
    return value;
};

export const fieldKeyToValue = (
    value: UniqueIdentifier | null,
): string | null => {
    if (value === "__NULL__" || value === null) return null;
    return value.toString();
};
