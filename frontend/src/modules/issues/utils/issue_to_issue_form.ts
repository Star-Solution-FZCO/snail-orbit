import { CreateIssueT, FieldValueT, IssueT } from "types";

export const issueToIssueForm = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue.project.id,
    fields: Object.keys(issue.fields).reduce(
        (prev, cur) => {
            if (!issue.fields[cur].value) return prev;
            if (issue.fields[cur].type === "user")
                prev[cur] = issue.fields[cur].value.id;
            else if (issue.fields[cur].type === "user_multi")
                prev[cur] = issue.fields[cur].value.map((el) => el.id);
            else prev[cur] = issue.fields[cur].value;
            return prev;
        },
        {} as Record<string, FieldValueT>,
    ),
});
