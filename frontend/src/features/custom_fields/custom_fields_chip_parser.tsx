import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateChip } from "entities/custom_fields/date_chip";
import { DurationChip } from "entities/custom_fields/duration_chip";
import { EnumChip } from "entities/custom_fields/enum_chip";
import { InputChip } from "entities/custom_fields/input_chip";
import UserChip from "entities/custom_fields/user_chip";
import type { FC, ReactNode } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";

dayjs.extend(utc);

export type CustomFieldsChipParserV2Props = {
    field: CustomFieldWithValueT;
    onChange?: (field: CustomFieldWithValueT) => unknown;
    rightAdornmentRenderer?: (field: CustomFieldWithValueT) => ReactNode;
    size?: "medium" | "small" | "xsmall";
};

export const CustomFieldsChipParser: FC<CustomFieldsChipParserV2Props> = ({
    field,
    onChange,
    rightAdornmentRenderer,
    size = "small",
}) => {
    const baseCompProps = {
        id: field.id,
        label: field.name,
        rightAdornment: rightAdornmentRenderer?.(field),
        size: size,
    };

    switch (field.type) {
        case "enum":
        case "enum_multi":
        case "owned":
        case "owned_multi":
        case "state":
        case "version":
        case "version_multi":
        case "sprint":
        case "sprint_multi":
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={
                        field.value
                            ? Array.isArray(field.value)
                                ? field.value.map((el) => ({
                                      ...el,
                                      uuid: el.id,
                                  }))
                                : { ...field.value, uuid: field.value.id }
                            : undefined
                    }
                    multiple={
                        field.type === "enum_multi" ||
                        field.type === "owned_multi" ||
                        field.type === "version_multi" ||
                        field.type === "sprint_multi"
                    }
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as never,
                        });
                    }}
                    addEmptyOption
                />
            );
        case "string":
            return (
                <InputChip
                    {...baseCompProps}
                    key={field.id}
                    inputMode="text"
                    value={field.value?.toString() || ""}
                    onChange={(val) => {
                        onChange?.({
                            ...field,
                            value: val,
                        });
                    }}
                />
            );
        case "integer":
        case "float":
            return (
                <InputChip
                    {...baseCompProps}
                    key={field.id}
                    inputMode={field.type === "integer" ? "numeric" : "decimal"}
                    value={field.value?.toString() || ""}
                    onChange={(val) => {
                        onChange?.({
                            ...field,
                            value: Number(val),
                        });
                    }}
                />
            );
        case "duration":
            return (
                <DurationChip
                    {...baseCompProps}
                    key={field.id}
                    value={field.value || undefined}
                    onChange={(val) => {
                        onChange?.({
                            ...field,
                            value: val,
                        });
                    }}
                />
            );
        case "boolean":
            return (
                <Tooltip
                    key={field.id}
                    arrow
                    title={`${field.name}: ${field?.value ? "+" : "-"}`}
                    enterDelay={1000}
                >
                    <FieldChip
                        onClick={() => {
                            const newValue = !field?.value;
                            onChange?.({
                                ...field,
                                value: newValue,
                            });
                        }}
                    >
                        {field?.value ? "+" : "-"}
                    </FieldChip>
                </Tooltip>
            );
        case "user":
        case "user_multi":
            return (
                <UserChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    multiple={field.type === "user_multi"}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as never,
                        });
                    }}
                />
            );
        case "date":
        case "datetime": {
            const parsedValue = dayjs(field.value);
            return (
                <DateChip
                    {...baseCompProps}
                    key={field.id}
                    value={parsedValue.isValid() ? parsedValue : undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value.format(
                                field.type === "datetime"
                                    ? "YYYY-MM-DDTHH:mm:ss"
                                    : "YYYY-MM-DD",
                            ),
                        });
                    }}
                    type={field.type === "datetime" ? "datetime" : "date"}
                />
            );
        }
        default:
            return null;
    }
};
