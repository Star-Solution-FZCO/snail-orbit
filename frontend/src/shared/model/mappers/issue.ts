import type {
    CustomFieldValueT,
    CustomFieldWithValueT,
    IssueT,
} from "shared/model/types";
import type { IssueCreate } from "../types/backend-schema.gen";

export const fieldToFieldValue = (
    field?: CustomFieldWithValueT,
): CustomFieldValueT => {
    if (!field) return null;
    switch (field.type) {
        case "user":
            return field.value?.id;
        case "user_multi":
            return field.value?.map((el) => el.id);
        case "enum":
        case "state":
        case "version":
        case "owned":
        case "sprint":
            return field.value?.value;
        case "enum_multi":
        case "version_multi":
        case "owned_multi":
        case "sprint_multi":
            return field.value?.map((el) => el.value);
        case "date":
        case "datetime":
            return field.value;
        case "boolean":
        case "duration":
        case "string":
        case "float":
        case "integer":
            return field.value?.toString();
        default:
            return null;
    }
};

export const fieldsToFieldValueMap = (fields: CustomFieldWithValueT[]) =>
    fields.reduce(
        (prev, cur) => {
            if (!cur) return prev;
            prev[cur.name] = fieldToFieldValue(cur);
            return prev;
        },
        {} as Record<string, CustomFieldValueT>,
    );

export const issueToCreateIssue = (issue: IssueT): IssueCreate => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue?.project?.id || "",
    fields: fieldsToFieldValueMap(Object.values(issue.fields)),
    attachments: issue.attachments.map(({ id, encryption }) => ({
        id,
        encryption,
    })),
});
