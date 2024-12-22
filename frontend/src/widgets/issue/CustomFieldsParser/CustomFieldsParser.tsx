import FieldCard from "components/fields/field_card/field_card";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateField } from "features/custom_fields/date_field";
import { EnumField } from "features/custom_fields/enum_field";
import { InputField } from "features/custom_fields/input_field";
import { UserField } from "features/custom_fields/user_field";
import { VersionField } from "features/custom_fields/version_field";
import type { FC } from "react";
import { fieldsToFieldValueMap } from "store/utils/issue";
import type { CustomFieldValueT, FieldValueT } from "types";
import type { CustomFieldsParserProps } from "./CustomFieldsParser.types";

dayjs.extend(utc);

export const CustomFieldsParser: FC<CustomFieldsParserProps> = ({
    availableFields,
    activeFields,
    onUpdateIssue,
    onUpdateCache,
    rightAdornmentRenderer,
}) => {
    const updateCustomFields = (key: string, value: FieldValueT) => {
        if (!onUpdateIssue) return;
        onUpdateIssue({
            ...fieldsToFieldValueMap(Object.values(activeFields)),
            [key]: value,
        });
    };

    const updateCache = (key: string, value: CustomFieldValueT) => {
        if (!onUpdateCache) return;
        const targetField = activeFields[key];
        if (targetField) onUpdateCache({ [key]: { ...targetField, value } });
        else {
            const field = availableFields.find((el) => el.name === key);
            if (field) onUpdateCache({ [key]: { ...field, value } });
        }
    };

    return (
        <>
            {availableFields
                .map((fieldData) => {
                    const field = activeFields[fieldData.name];
                    switch (fieldData.type) {
                        case "enum":
                        case "enum_multi":
                            return (
                                <EnumField
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        (field.type === "enum" ||
                                            field.type === "enum_multi")
                                            ? field.value
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                        updateCache(fieldData.name, value);
                                    }}
                                    multiple={fieldData.type === "enum_multi"}
                                    enumFieldId={fieldData.id}
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "string":
                        case "integer":
                        case "float":
                            return (
                                <InputField
                                    key={fieldData.id}
                                    onChange={(val) => {
                                        const newValue =
                                            fieldData.type === "string"
                                                ? val
                                                : Number(val);
                                        updateCustomFields(
                                            fieldData.name,
                                            newValue,
                                        );
                                        updateCache(fieldData.name, newValue);
                                    }}
                                    value={
                                        field &&
                                        (field.type === "string" ||
                                            field.type === "integer" ||
                                            field.type === "float") &&
                                        field.value !== null
                                            ? field.value.toString()
                                            : undefined
                                    }
                                    label={fieldData.name}
                                    id={fieldData.id}
                                    inputMode={
                                        fieldData.type === "float"
                                            ? "decimal"
                                            : fieldData.type === "integer"
                                              ? "numeric"
                                              : "text"
                                    }
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "boolean":
                            return (
                                <FieldCard
                                    key={fieldData.id}
                                    orientation="vertical"
                                    label={fieldData.name}
                                    value={field?.value ? "+" : "-"}
                                    onClick={() => {
                                        const newValue = !field?.value;
                                        updateCustomFields(
                                            fieldData.name,
                                            newValue,
                                        );
                                        updateCache(fieldData.name, newValue);
                                    }}
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "user":
                        case "user_multi":
                            return (
                                <UserField
                                    key={fieldData.id}
                                    value={
                                        field &&
                                        (field.type === "user" ||
                                            field.type === "user_multi")
                                            ? field?.value
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.id)
                                                : value.id,
                                        );
                                        updateCache(fieldData.name, value);
                                    }}
                                    label={fieldData.name}
                                    multiple={fieldData.type === "user_multi"}
                                    id={fieldData.id}
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "date":
                        case "datetime":
                            return (
                                <DateField
                                    key={fieldData.id}
                                    value={
                                        field &&
                                        (field.type === "date" ||
                                            field.type === "datetime") &&
                                        field.value
                                            ? dayjs(field.value)
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        const newValue = value.format(
                                            fieldData.type === "date"
                                                ? "YYYY-MM-DD"
                                                : "YYYY-MM-DDTHH:mm:ss",
                                        );
                                        updateCustomFields(
                                            fieldData.name,
                                            newValue,
                                        );
                                        updateCache(fieldData.name, newValue);
                                    }}
                                    label={fieldData.name}
                                    id={fieldData.id}
                                    type={
                                        fieldData.type === "date"
                                            ? "date"
                                            : "datetime"
                                    }
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "state":
                            return (
                                <EnumField
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        field.type === "state" &&
                                        field.value
                                            ? {
                                                  ...field.value,
                                                  value: field.value.state,
                                              }
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                        updateCache(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => ({
                                                      ...el,
                                                      state: el.value,
                                                  }))
                                                : {
                                                      ...value,
                                                      state: value.value,
                                                  },
                                        );
                                    }}
                                    enumFieldId={fieldData.id}
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        case "version":
                        case "version_multi":
                            return (
                                <VersionField
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        (field.type === "version" ||
                                            field.type === "version_multi")
                                            ? field.value
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                        updateCache(fieldData.name, value);
                                    }}
                                    multiple={
                                        fieldData.type === "version_multi"
                                    }
                                    fieldId={fieldData.id}
                                    rightAdornment={rightAdornmentRenderer?.(
                                        fieldData,
                                    )}
                                />
                            );
                        default:
                            return null;
                    }
                })
                .filter(Boolean)}
        </>
    );
};
