import type { AgileFieldValueT } from "types";

export const normalizeFieldValue = (field: AgileFieldValueT) => {
    return {
        value:
            "state" in field
                ? field.state
                : "version" in field
                  ? field.version
                  : field.value,
        color: "color" in field ? field.color || undefined : undefined,
    };
};
