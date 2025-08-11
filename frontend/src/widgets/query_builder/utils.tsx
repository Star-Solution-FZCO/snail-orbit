import type { QueryBuilderDataAvailableFieldT } from "shared/model/types";

export const getDefaultValueForField = (
    field: QueryBuilderDataAvailableFieldT,
): {
    [p: string]: unknown;
} => {
    if (
        field.type === "integer" ||
        field.type === "float" ||
        field.type === "duration"
    )
        return {
            ...field,
            value: 0,
        };
    if (field.type === "boolean")
        return {
            ...field,
            value: false,
        };
    if (field.type === "string")
        return {
            ...field,
            value: "",
        };
    return {
        ...field,
        value: null,
    };
};
