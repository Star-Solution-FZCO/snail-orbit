import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateChip } from "entities/custom_fields/date_chip";
import { DurationChip } from "entities/custom_fields/duration_chip";
import { EnumChip } from "entities/custom_fields/enum_chip";
import { InputChip } from "entities/custom_fields/input_chip";
import { OwnedChip } from "entities/custom_fields/owned_chip";
import UserChip from "entities/custom_fields/user_chip";
import type { FC, ReactNode } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";
import type {
    EnumOption,
    OwnedOption,
    StateOption,
    UserOutput,
    VersionOption,
} from "shared/model/types/backend-schema.gen";
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
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={field.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as EnumOption,
                        });
                    }}
                />
            );
        case "enum_multi":
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={field.value || undefined}
                    multiple
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as EnumOption[],
                        });
                    }}
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
            return (
                <InputChip
                    {...baseCompProps}
                    key={field.id}
                    inputMode="numeric"
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
        case "float": {
            return (
                <InputChip
                    {...baseCompProps}
                    key={field.id}
                    inputMode="decimal"
                    value={field.value?.toString() || ""}
                    onChange={(val) => {
                        onChange?.({
                            ...field,
                            value: Number(val),
                        });
                    }}
                />
            );
        }
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
            return (
                <UserChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as UserOutput,
                        });
                    }}
                />
            );
        case "user_multi": {
            return (
                <UserChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as UserOutput[],
                        });
                    }}
                    multiple
                />
            );
        }
        case "date": {
            const parsedValue = dayjs(field.value);
            return (
                <DateChip
                    {...baseCompProps}
                    key={field.id}
                    value={parsedValue.isValid() ? parsedValue : undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value.format("YYYY-MM-DD"),
                        });
                    }}
                    type="date"
                />
            );
        }
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
                            value: value.format("YYYY-MM-DDTHH:mm:ss"),
                        });
                    }}
                    type="datetime"
                />
            );
        }
        case "state":
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as StateOption,
                        });
                    }}
                />
            );
        case "version":
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as VersionOption,
                        });
                    }}
                />
            );
        case "version_multi":
            return (
                <EnumChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as VersionOption[],
                        });
                    }}
                    multiple
                />
            );
        case "owned":
            return (
                <OwnedChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as OwnedOption,
                        });
                    }}
                />
            );
        case "owned_multi":
            return (
                <OwnedChip
                    {...baseCompProps}
                    key={field.id}
                    value={field?.value || undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value: value as OwnedOption[],
                        });
                    }}
                    multiple
                />
            );
        default:
            return null;
    }
};
