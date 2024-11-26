import type { AgileFieldValueT } from "types";

export const normalizeFieldValue = (field: AgileFieldValueT) => {
    return {
        value: "state" in field ? field.state : field.value,
        color: field.color || undefined,
    };
};
