import type { AgileFieldValueT } from "shared/model/types";
import type {
    BoardColumnOutputRootModel,
    BoardSwimlaneOutputRootModel,
} from "shared/model/types/backend-schema.gen";

export const getFieldValue = (
    field:
        | BoardSwimlaneOutputRootModel["values"][0]
        | BoardColumnOutputRootModel["values"][0]
        | null,
) => {
    if (!field) return null;
    if (typeof field !== "object") return field;
    if ("value" in field) return field.value;
    if ("id" in field) return field.id;
};

export const normalizeFieldValue = (field: AgileFieldValueT) => {
    return {
        value: getFieldValue(field),
        color: "color" in field ? field.color || undefined : undefined,
    };
};
