import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { CustomFieldT } from "../../../types";
import { EnumField } from "./fields/enum_field.tsx";
import { IssueFormData } from "./issue_form.tsx";

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
                                        <EnumField
                                            {...rest}
                                            options={fieldData.options || []}
                                            label={fieldData.name}
                                            value={value as string}
                                            onChange={onChange}
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
