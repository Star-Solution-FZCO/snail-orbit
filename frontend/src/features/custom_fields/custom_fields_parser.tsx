import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DateField } from "entities/custom_fields/date_field";
import { DurationField } from "entities/custom_fields/duration_field";
import { EnumField } from "entities/custom_fields/enum_field";
import { InputField } from "entities/custom_fields/input_field";
import { OwnedField } from "entities/custom_fields/owned_field";
import { UserField } from "entities/custom_fields/user_field";
import { VersionField } from "entities/custom_fields/version_field";
import type { FC, ReactNode } from "react";
import type { CustomFieldWithValueT } from "shared/model/types";
import type {
    EnumOption,
    OwnedOption,
    StateOption,
    UserOutput,
    VersionOption,
} from "shared/model/types/backend-schema.gen";
import FieldCard from "shared/ui/fields/field_card/field_card";

dayjs.extend(utc);

export type CustomFieldsParserProps = {
    field: CustomFieldWithValueT;
    onChange?: (field: CustomFieldWithValueT) => unknown;
    rightAdornmentRenderer?: (field: CustomFieldWithValueT) => ReactNode;
    customFieldsErrors?: Record<string, string>;
};

export const CustomFieldsParser: FC<CustomFieldsParserProps> = ({
    field,
    onChange,
    rightAdornmentRenderer,
    customFieldsErrors,
}) => {
    const baseCompProps = {
        id: field.id,
        label: field.name,
        rightAdornment: rightAdornmentRenderer?.(field),
        error: customFieldsErrors?.[field.name],
    };

    switch (field.type) {
        case "enum":
            return (
                <EnumField
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
                <EnumField
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
                <InputField
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
                <InputField
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
                <DurationField
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
                <InputField
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
                <FieldCard
                    {...baseCompProps}
                    key={field.id}
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
                <UserField
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
                <DateField
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
                <DateField
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
                <EnumField
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
                <VersionField
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
                <VersionField
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
                <OwnedField
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
                <OwnedField
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
