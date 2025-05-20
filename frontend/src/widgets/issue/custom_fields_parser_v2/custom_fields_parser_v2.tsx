import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateField } from "features/custom_fields/date_field";
import { EnumField } from "features/custom_fields/enum_field";
import { InputField } from "features/custom_fields/input_field";
import { UserField } from "features/custom_fields/user_field";
import { VersionField } from "features/custom_fields/version_field";
import type { FC } from "react";
import { useCallback } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";
import type {
    EnumOption,
    StateOption,
    UserOutput,
    VersionOption,
} from "shared/model/types/backend-schema.gen";
import FieldCard from "shared/ui/fields/field_card/field_card";
import type { CustomFieldsParserV2Props } from "./custom_fields_parser_v2.types";

dayjs.extend(utc);

export const CustomFieldsParserV2: FC<CustomFieldsParserV2Props> = ({
    fields,
    onChange,
    rightAdornmentRenderer,
}) => {
    const baseCompProps = useCallback(
        (field: CustomFieldWithValueT) => ({
            id: field.id,
            key: field.id,
            label: field.name,
            rightAdornment: rightAdornmentRenderer?.(field),
        }),
        [rightAdornmentRenderer],
    );

    return (
        <>
            {fields
                .map((field) => {
                    switch (field.type) {
                        case "enum":
                            return (
                                <EnumField
                                    {...baseCompProps(field)}
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
                                <EnumField
                                    {...baseCompProps(field)}
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
                                <InputField
                                    {...baseCompProps(field)}
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
                                <InputField
                                    {...baseCompProps(field)}
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
                                <InputField
                                    {...baseCompProps(field)}
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
                                <FieldCard
                                    {...baseCompProps(field)}
                                    orientation="vertical"
                                    value={field.value ? "+" : "-"}
                                    onClick={() => {
                                        onChange?.({
                                            ...field,
                                            value: !field.value,
                                        });
                                    }}
                                />
                            );
                        case "user":
                            return (
                                <UserField
                                    {...baseCompProps(field)}
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
                                <UserField
                                    {...baseCompProps(field)}
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
                                <DateField
                                    {...baseCompProps(field)}
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
                                <DateField
                                    {...baseCompProps(field)}
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
                                <EnumField
                                    {...baseCompProps(field)}
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
                                <VersionField
                                    {...baseCompProps(field)}
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
                                <VersionField
                                    {...baseCompProps(field)}
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
                        default:
                            return null;
                    }
                })
                .filter(Boolean)}
        </>
    );
};
