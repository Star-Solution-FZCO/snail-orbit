import { CreateIssueT, IssueT, IssueValueT } from "types";

export const issueToIssueForm = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue.project.id,
    fields: Object.keys(issue.fields).reduce(
        (prev, cur) => {
            if (!issue.fields[cur].value) return prev;
            prev[cur] = issue.fields[cur].value;
            return prev;
        },
        {} as Record<string, IssueValueT>,
    ),
});
