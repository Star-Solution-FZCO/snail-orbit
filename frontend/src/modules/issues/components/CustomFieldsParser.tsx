import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import FieldCard from "../../../components/fields/field_card/field_card";
import { CustomFieldT } from "../../../types";
import { InputField } from "./fields/input_field";
import { SelectField } from "./fields/select_field";
import { UserField } from "./fields/user_field";
import { IssueFormData } from "./issue_form";
import { enumToSelectOption } from "./utils/enum_to_select_option";

type CustomFieldsParserProps = {
    fields: CustomFieldT[];
};

// TODO: Разобраться как правильно типизировать этот ужас и избавиться от ts-ignore

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
                                        <SelectField
                                            {...rest}
                                            options={enumToSelectOption(
                                                fieldData.options,
                                            )}
                                            label={fieldData.name}
                                            value={value as string | string[]}
                                            onChange={onChange}
                                            multiple={
                                                fieldData.type === "enum_multi"
                                            }
                                            id={fieldData.id}
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
                                            value={value as string}
                                            onChange={onChange}
                                            label={fieldData.name}
                                            multiple={
                                                fieldData.type === "user_multi"
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
