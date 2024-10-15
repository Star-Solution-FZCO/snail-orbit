import FieldCard from "components/fields/field_card/field_card";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { FC } from "react";
import {
    CustomFieldT,
    CustomFieldValueT,
    FieldValueT,
    IssueT,
    UpdateIssueT,
} from "types";
import { transformFields } from "../utils";
import { DateField } from "./fields/date_field";
import { EnumField } from "./fields/enum_field";
import { InputField } from "./fields/input_field";
import { UserField } from "./fields/user_field";

dayjs.extend(utc);

type CustomFieldsParserProps = {
    fields: CustomFieldT[];
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
};

export const CustomFieldsParser: FC<CustomFieldsParserProps> = ({
    fields,
    issue,
    onUpdateIssue,
    onUpdateCache,
}) => {
    const updateCustomFields = (key: string, value: FieldValueT) => {
        onUpdateIssue({
            fields: {
                ...transformFields(Object.values(issue.fields)),
                [key]: value,
            },
        });
    };

    const updateCache = (key: string, value: CustomFieldValueT) => {
        const targetField = issue.fields[key];
        if (targetField)
            onUpdateCache({ fields: { [key]: { ...targetField, value } } });
        else {
            const field = fields.find((el) => el.name === key);
            if (field)
                onUpdateCache({ fields: { [key]: { ...field, value } } });
        }
    };

    return (
        <>
            {fields
                .map((fieldData) => {
                    const field = issue.fields[fieldData.name];
                    switch (fieldData.type) {
                        case "enum":
                        case "enum_multi":
                            return (
                                <EnumField
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        (field.type === "enum" ||
                                            field.type === "enum_multi")
                                            ? field.value
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                        updateCache(fieldData.name, value);
                                    }}
                                    multiple={fieldData.type === "enum_multi"}
                                    enumFieldId={fieldData.id}
                                />
                            );
                        case "string":
                        case "integer":
                        case "float":
                            return (
                                <InputField
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
                                        updateCache(fieldData.name, newValue);
                                    }}
                                    value={
                                        field &&
                                        (field.type === "string" ||
                                            field.type === "integer" ||
                                            field.type === "float") &&
                                        field.value !== null
                                            ? field.value.toString()
                                            : undefined
                                    }
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
                        case "boolean":
                            return (
                                <FieldCard
                                    key={fieldData.id}
                                    orientation="vertical"
                                    label={fieldData.name}
                                    value={!!field?.value ? "+" : "-"}
                                    onClick={() => {
                                        const newValue = !field?.value;
                                        updateCustomFields(
                                            fieldData.name,
                                            newValue,
                                        );
                                        updateCache(fieldData.name, newValue);
                                    }}
                                />
                            );
                        case "user":
                        case "user_multi":
                            return (
                                <UserField
                                    key={fieldData.id}
                                    value={
                                        field &&
                                        (field.type === "user" ||
                                            field.type === "user_multi")
                                            ? field?.value
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.id)
                                                : value.id,
                                        );
                                        updateCache(fieldData.name, value);
                                    }}
                                    label={fieldData.name}
                                    multiple={fieldData.type === "user_multi"}
                                    id={fieldData.id}
                                />
                            );
                        case "date":
                        case "datetime":
                            return (
                                <DateField
                                    key={fieldData.id}
                                    value={
                                        field &&
                                        (field.type === "date" ||
                                            field.type === "datetime") &&
                                        field.value
                                            ? dayjs(field.value)
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
                                        updateCache(fieldData.name, newValue);
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
                        case "state":
                            return (
                                <EnumField
                                    key={fieldData.id}
                                    label={fieldData.name}
                                    value={
                                        field &&
                                        field.type === "state" &&
                                        field.value
                                            ? {
                                                  ...field.value,
                                                  value: field.value.state,
                                              }
                                            : undefined
                                    }
                                    onChange={(value) => {
                                        updateCustomFields(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => el.value)
                                                : value.value,
                                        );
                                        updateCache(
                                            fieldData.name,
                                            Array.isArray(value)
                                                ? value.map((el) => ({
                                                      ...el,
                                                      state: el.value,
                                                  }))
                                                : {
                                                      ...value,
                                                      state: value.value,
                                                  },
                                        );
                                    }}
                                    enumFieldId={fieldData.id}
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
