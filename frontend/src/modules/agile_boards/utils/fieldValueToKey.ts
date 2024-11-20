import { UniqueIdentifier } from "@dnd-kit/core";

export const fieldValueToSwimlaneKey = (
    swimlaneValue: string | null | undefined,
): string => {
    if (swimlaneValue === null || swimlaneValue === undefined)
        return "All fields";
    return swimlaneValue;
};

export const fieldValueToColumnKey = (
    swimlaneValue: string | null | undefined,
    columnValue: string,
): string => {
    if (swimlaneValue === null || swimlaneValue === undefined)
        return columnValue;
    return `${swimlaneValue}!#!${columnValue}`;
};

export const swimlaneKeyToFieldValue = (
    value: UniqueIdentifier | null,
): string | null => {
    if (value === "All fields" || value === null) return null;
    return value.toString();
};

export const columnKeyToFieldValue = (
    value: UniqueIdentifier | null,
): string | null => {
    if (value === null) return null;
    if (Number.isInteger(value)) return value.toString();
    if (!(value as string).includes("!#!")) return value.toString();
    const [_, column] = (value as string).split("!#!");
    return column;
};
