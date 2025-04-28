import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateChip } from "features/custom_fields/date_chip";
import { EnumChip } from "features/custom_fields/enum_chip";
import { InputChip } from "features/custom_fields/input_chip";
import UserChip from "features/custom_fields/user_chip";
import type { FC } from "react";
import type { FieldValueT } from "shared/model/types";
import { fieldsToFieldValueMap } from "shared/model/mappers/issue";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";
import type { CustomFieldsChipParserProps } from "./custom_field_chip_parser.types";

dayjs.extend(utc);

export const CustomFieldsChipParser: FC<CustomFieldsChipParserProps> = ({
    availableFields,
    activeFields,
    onUpdateIssue,
}) => {
    const updateCustomFields = (key: string, value: FieldValueT) => {
        onUpdateIssue({
            ...fieldsToFieldValueMap(Object.values(activeFields)),
            [key]: value,
        });
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
                                <EnumChip
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
                                    }}
                                    multiple={fieldData.type === "enum_multi"}
                                    enumFieldId={fieldData.id}
                                />
                            );
                        case "string":
                        case "integer":
                        case "float":
                            return (
                                <InputChip
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
                                    }}
                                    value={
                                        field &&
                                        (field.type === "string" ||
                                            field.type === "integer" ||
                                            field.type === "float") &&
                                        field.value !== null &&
                                        field.value !== undefined
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
                                />
                            );
                        case "user":
                        case "user_multi":
                            return (
                                <UserChip
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
                                    }}
                                    label={fieldData.name}
                                    multiple={fieldData.type === "user_multi"}
                                    id={fieldData.id}
                                />
                            );
                        case "date":
                        case "datetime":
                            return (
                                <DateChip
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
                                    }}
                                    label={fieldData.name}
                                    id={fieldData.id}
                                    type={
                                        fieldData.type === "date"
                                            ? "date"
                                            : "datetime"
                                    }
                                />
                            );
                        case "boolean":
                            return (
                                <Tooltip
                                    key={fieldData.id}
                                    arrow
                                    title={`${fieldData.name}: ${field?.value ? "+" : "-"}`}
                                    enterDelay={1000}
                                >
                                    <FieldChip
                                        onClick={() => {
                                            const newValue = !field?.value;
                                            updateCustomFields(
                                                fieldData.name,
                                                newValue,
                                            );
                                        }}
                                    >
                                        {field?.value ? "+" : "-"}
                                    </FieldChip>
                                </Tooltip>
                            );
                        case "state":
                            return (
                                <EnumChip
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        field.type === "state" &&
                                        field.value
                                            ? {
                                                  ...field.value,
                                                  value: field.value.value,
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
                                    }}
                                    enumFieldId={fieldData.id}
                                />
                            );
                        case "version":
                        case "version_multi":
                            return (
                                <EnumChip
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        (field &&
                                            field.value &&
                                            (field.type === "version"
                                                ? {
                                                      ...field.value,
                                                      value: field.value.value,
                                                  }
                                                : field.type === "version_multi"
                                                  ? field.value.map((el) => ({
                                                        ...el,
                                                        value: el.value,
                                                    }))
                                                  : undefined)) ||
                                        undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                    }}
                                    enumFieldId={fieldData.id}
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
