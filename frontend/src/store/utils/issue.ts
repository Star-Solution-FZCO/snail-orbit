import { CreateIssueT, CustomFieldT, FieldValueT, IssueT } from "../../types";

export const fieldsToFieldValueMap = (fields: CustomFieldT[]) =>
    fields.reduce(
        (prev, cur) => {
            if (!cur) return prev;
            if (cur.type === "user") prev[cur.name] = cur.value?.id;
            else if (cur.type === "user_multi")
                prev[cur.name] = cur.value?.map((el) => el.id);
            else if (cur.type === "enum") prev[cur.name] = cur.value?.value;
            else if (cur.type === "enum_multi")
                prev[cur.name] = cur.value?.map((el) => el.value);
            else if (cur.type === "state") prev[cur.name] = cur.value?.state;
            else prev[cur.name] = cur.value;
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
