import { CustomFieldOptionT, CustomFieldTypeT, CustomFieldValueT } from "types";

const complexCustomFieldTypes = new Set<CustomFieldTypeT>([
    "enum",
    "enum_multi",
    "user",
    "user_multi",
    "version",
    "version_multi",
    "state",
]);

export const isComplexCustomFieldType = (type: CustomFieldTypeT) => {
    return complexCustomFieldTypes.has(type);
};

const primitiveTypes = new Set(["string", "number", "boolean"]);

export const isPrimitive = (value: CustomFieldValueT): boolean =>
    primitiveTypes.has(typeof value);

export const complexValueGetter = (cfValue: CustomFieldValueT): string => {
    if (typeof cfValue === "object") {
        if ("value" in cfValue) {
            return cfValue.value;
        }
        if ("id" in cfValue) {
            return cfValue.id;
        }
    }
    return cfValue as string;
};

export const defaultValueGetter = (
    cfValue: CustomFieldValueT,
): string | string[] | number | boolean | null => {
    if (isPrimitive(cfValue) || cfValue === null) {
        return cfValue as string | number | boolean | null;
    }

    if (Array.isArray(cfValue)) {
        return cfValue.map((v) => complexValueGetter(v));
    }

    if (typeof cfValue === "object") {
        return complexValueGetter(cfValue);
    }
    return null;
};

export const getOptionLabel = (option: CustomFieldOptionT) => {
    return typeof option.value === "string" ? option.value : option.value.name;
};

export const getOptionValue = (option: CustomFieldOptionT) => {
    return typeof option.value === "string" ? option.value : option.value.id;
};
