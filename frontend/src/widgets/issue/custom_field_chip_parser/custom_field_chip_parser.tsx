import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateChip } from "features/custom_fields/date_chip";
import { EnumChip } from "features/custom_fields/enum_chip";
import { InputChip } from "features/custom_fields/input_chip";
import UserChip from "features/custom_fields/user_chip";
import type { FC } from "react";
import { fieldsToFieldValueMap } from "shared/model/mappers/issue";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";
import type { CustomFieldValueT } from "../../../shared/model/types";
import type { CustomFieldsChipParserProps } from "./custom_field_chip_parser.types";

dayjs.extend(utc);

export const CustomFieldsChipParser: FC<CustomFieldsChipParserProps> = ({
    availableFields,
    activeFields,
    onUpdateIssue,
}) => {
    const updateCustomFields = (key: string, value: CustomFieldValueT) => {
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
                        case "enum_multi": {
                            const parsedField =
                                field.type === "enum" ||
                                field.type === "enum_multi"
                                    ? field
                                    : null;
                            return (
                                <EnumChip
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={parsedField?.value || undefined}
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
                        }
                        case "string":
                        case "integer":
                        case "float": {
                            const parsedField =
                                field.type === "string" ||
                                field.type === "integer" ||
                                field.type === "float"
                                    ? field
                                    : null;
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
                                    value={parsedField?.value?.toString() || ""}
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
                        }
                        case "user":
                        case "user_multi": {
                            const parsedField =
                                field.type === "user" ||
                                field.type === "user_multi"
                                    ? field
                                    : null;
                            return (
                                <UserChip
                                    key={fieldData.id}
                                    value={parsedField?.value || undefined}
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
                        }
                        case "date":
                        case "datetime": {
                            const parsedField =
                                field.type === "date" ||
                                field.type === "datetime"
                                    ? field
                                    : null;
                            return (
                                <DateChip
                                    key={fieldData.id}
                                    value={
                                        parsedField
                                            ? dayjs(parsedField.value)
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
                        }
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
                        case "state": {
                            const parsedField =
                                field.type === "state" ? field : null;
                            return (
                                <EnumChip
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={parsedField?.value || undefined}
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
                        }
                        case "version":
                        case "version_multi": {
                            const parsedField =
                                field.type === "version" ||
                                field.type === "version_multi"
                                    ? field
                                    : null;
                            return (
                                <EnumChip
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={parsedField?.value || undefined}
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
                        }
                        default:
                            return null;
                    }
                })
                .filter(Boolean)}
        </>
    );
};
