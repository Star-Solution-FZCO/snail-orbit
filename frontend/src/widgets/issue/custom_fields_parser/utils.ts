import type { CustomFieldT } from "types";

export const getUserFieldValue = (field: CustomFieldT) => {
    if (field.type !== "user" && field.type !== "user_multi")
        throw new Error("Wrong field type");

    if (field.type === "user") return field.value || null;
    return field.value || [];
};

export const getVersionFieldValue = (field: CustomFieldT) => {
    if (field.type !== "version" && field.type !== "version_multi")
        throw new Error("Wrong field type");

    if (field.type === "version") return field.value || null;
    return field.value || [];
};
