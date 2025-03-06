import type { CreateIssueT, CustomFieldT, FieldValueT, IssueT } from "types";

export const fieldToFieldValue = (field?: CustomFieldT): FieldValueT => {
    if (!field) return null;
    if (field.type === "user") return field.value?.id;
    else if (field.type === "user_multi")
        return field.value?.map((el) => el.id);
    else if (field.type === "enum") return field.value?.value;
    else if (field.type === "enum_multi")
        return field.value?.map((el) => el.value);
    else if (field.type === "state") return field.value?.value;
    else if (field.type === "version") return field.value?.value;
    else if (field.type === "version_multi")
        return field.value?.map((el) => el.value);
    else return field.value;
};

export const fieldsToFieldValueMap = (fields: CustomFieldT[]) =>
    fields.reduce(
        (prev, cur) => {
            if (!cur) return prev;
            prev[cur.name] = fieldToFieldValue(cur);
            return prev;
        },
        {} as Record<string, FieldValueT>,
    );

export const issueToCreateIssue = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue?.project?.id || "",
    fields: fieldsToFieldValueMap(Object.values(issue.fields)),
    attachments: issue.attachments.map((el) => el.id),
});
