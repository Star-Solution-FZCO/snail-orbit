import { DateField } from "entities/custom_fields/date_field";
import { DurationField } from "entities/custom_fields/duration_field";
import { EnumField } from "entities/custom_fields/enum_field";
import { InputField } from "entities/custom_fields/input_field";
import { UserField } from "entities/custom_fields/user_field";
import type { FC, ReactNode } from "react";
import dayjs from "shared/date";
import type { CustomFieldWithValueT } from "shared/model/types";
import FieldCard from "shared/ui/fields/field_card/field_card";

export type CustomFieldsParserProps = {
    field: CustomFieldWithValueT;
    onChange?: (field: CustomFieldWithValueT) => unknown;
    rightAdornmentRenderer?: (field: CustomFieldWithValueT) => ReactNode;
    customFieldsErrors?: Record<string, string>;
    clearable?: boolean;
};

export const CustomFieldsParser: FC<CustomFieldsParserProps> = ({
    field,
    onChange,
    rightAdornmentRenderer,
    customFieldsErrors,
    clearable,
}) => {
    const baseCompProps = {
        id: field.id,
        label: field.name,
        rightAdornment: rightAdornmentRenderer?.(field),
        error: customFieldsErrors?.[field.name],
        clearable,
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
                <EnumField
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
        case "float":
            return (
                <InputField
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
        case "user_multi":
            return (
                <UserField
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
                <DateField
                    {...baseCompProps}
                    key={field.id}
                    value={parsedValue.isValid() ? parsedValue : undefined}
                    onChange={(value) => {
                        onChange?.({
                            ...field,
                            value:
                                value?.format(
                                    field.type === "datetime"
                                        ? "YYYY-MM-DDTHH:mm:ss"
                                        : "YYYY-MM-DD",
                                ) || null,
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
