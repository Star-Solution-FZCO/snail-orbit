import type { AgileFieldValueT } from "shared/model/types";

export const getFieldValue = (field: AgileFieldValueT) =>
    "state" in field
        ? field.state
        : "version" in field
          ? field.version
          : field.value;

export const normalizeFieldValue = (field: AgileFieldValueT) => {
    return {
        value: getFieldValue(field),
        color: "color" in field ? field.color || undefined : undefined,
    };
};
