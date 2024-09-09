import FieldCard from "components/fields/field_card/field_card";
import dayjs from "dayjs";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { CustomFieldT } from "types";
import { DateField } from "./fields/date_field";
import { EnumField } from "./fields/enum_field";
import { InputField } from "./fields/input_field";
import { UserField } from "./fields/user_field";
import { IssueFormData } from "./issue_form";

type CustomFieldsParserProps = {
    fields: CustomFieldT[];
};

// TODO: Find a way to make proper typing without ts-ignore

export const CustomFieldsParser: FC<CustomFieldsParserProps> = ({ fields }) => {
    const { control } = useFormContext<IssueFormData>();

    return (
        <>
            {fields
                .map((fieldData) => {
                    switch (fieldData.type) {
                        case "enum":
                        case "enum_multi":
                            return (
                                <Controller
                                    control={control}
                                    key={fieldData.id}
                                    // @ts-ignore
                                    name={`fields.${fieldData.name}`}
                                    render={({
                                        field: { value, onChange, ...rest },
                                    }) => (
                                        <EnumField
                                            {...rest}
                                            label={fieldData.name}
                                            value={value as string | string[]}
                                            onChange={onChange}
                                            multiple={
                                                fieldData.type === "enum_multi"
                                            }
                                            enumFieldId={fieldData.id}
                                        />
                                    )}
                                />
                            );
                        case "string":
                        case "integer":
                        case "float":
                            return (
                                <Controller
                                    control={control}
                                    key={fieldData.id}
                                    // @ts-ignore
                                    name={`fields.${fieldData.name}`}
                                    render={({ field }) => (
                                        <InputField
                                            {...field}
                                            onChange={(val) =>
                                                field.onChange(
                                                    fieldData.type === "string"
                                                        ? val
                                                        : Number(val),
                                                )
                                            }
                                            value={field.value as string}
                                            label={fieldData.name}
                                            id={fieldData.id}
                                            inputMode={
                                                fieldData.type === "float"
                                                    ? "decimal"
                                                    : fieldData.type ===
                                                        "integer"
                                                      ? "numeric"
                                                      : "text"
                                            }
                                        />
                                    )}
                                />
                            );
                        case "boolean":
                            return (
                                <Controller
                                    control={control}
                                    key={fieldData.id}
                                    // @ts-ignore
                                    name={`fields.${fieldData.name}`}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <FieldCard
                                            orientation="vertical"
                                            label={fieldData.name}
                                            value={!!value ? "+" : "-"}
                                            onClick={() => onChange(!value)}
                                        />
                                    )}
                                />
                            );
                        case "user":
                        case "user_multi":
                            return (
                                <Controller
                                    control={control}
                                    key={fieldData.id}
                                    // @ts-ignore
                                    name={`fields.${fieldData.name}`}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <UserField
                                            value={value as string | string[]}
                                            onChange={onChange}
                                            label={fieldData.name}
                                            multiple={
                                                fieldData.type === "user_multi"
                                            }
                                            id={fieldData.id}
                                        />
                                    )}
                                />
                            );
                        case "date":
                        case "datetime":
                            return (
                                <Controller
                                    control={control}
                                    key={fieldData.id}
                                    // @ts-ignore
                                    name={`fields.${fieldData.name}`}
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <DateField
                                            value={
                                                !!value
                                                    ? dayjs(value as string)
                                                    : undefined
                                            }
                                            onChange={(value) =>
                                                onChange(value.toISOString())
                                            }
                                            label={fieldData.name}
                                            id={fieldData.id}
                                            type={
                                                fieldData.type === "date"
                                                    ? "date"
                                                    : "datetime"
                                            }
                                        />
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
