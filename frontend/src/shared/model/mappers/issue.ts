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
            return field.value?.value;
        case "enum_multi":
        case "version_multi":
            return field.value?.map((el) => el.value);
        default:
            return field.value;
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
