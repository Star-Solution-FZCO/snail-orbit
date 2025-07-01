import { Tooltip } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateChip } from "features/custom_fields/date_chip";
import { EnumChip } from "features/custom_fields/enum_chip";
import { InputChip } from "features/custom_fields/input_chip";
import { OwnedChip } from "features/custom_fields/owned_chip";
import UserChip from "features/custom_fields/user_chip";
import type { FC } from "react";
import { useCallback } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";
import type {
    EnumOption,
    OwnedOptionOutput,
    StateOption,
    UserOutput,
    VersionOption,
} from "shared/model/types/backend-schema.gen";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";
import type { CustomFieldsChipParserV2Props } from "./custom_fields_chip_parser.types";

dayjs.extend(utc);

export const CustomFieldsChipParserV2: FC<CustomFieldsChipParserV2Props> = ({
    fields,
    onChange,
    rightAdornmentRenderer,
    size = "small",
}) => {
    const baseCompProps = useCallback(
        (field: CustomFieldWithValueT) => ({
            id: field.id,
            label: field.name,
            rightAdornment: rightAdornmentRenderer?.(field),
            size: size,
        }),
        [rightAdornmentRenderer, size],
    );

    return (
        <>
            {fields
                .map((field) => {
                    switch (field.type) {
                        case "enum":
                            return (
                                <EnumChip
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                        case "float": {
                            return (
                                <InputChip
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
                                    key={field.id}
                                    value={
                                        parsedValue.isValid()
                                            ? parsedValue
                                            : undefined
                                    }
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
                                    {...baseCompProps(field)}
                                    key={field.id}
                                    value={
                                        parsedValue.isValid()
                                            ? parsedValue
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        onChange?.({
                                            ...field,
                                            value: value.format(
                                                "YYYY-MM-DDTHH:mm:ss",
                                            ),
                                        });
                                    }}
                                    type="datetime"
                                />
                            );
                        }
                        case "state":
                            return (
                                <EnumChip
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
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
                                    {...baseCompProps(field)}
                                    key={field.id}
                                    value={field?.value || undefined}
                                    onChange={(value) => {
                                        onChange?.({
                                            ...field,
                                            value: value as OwnedOptionOutput,
                                        });
                                    }}
                                />
                            );
                        case "owned_multi":
                            return (
                                <OwnedChip
                                    {...baseCompProps(field)}
                                    key={field.id}
                                    value={field?.value || undefined}
                                    onChange={(value) => {
                                        onChange?.({
                                            ...field,
                                            value: value as OwnedOptionOutput[],
                                        });
                                    }}
                                    multiple
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
