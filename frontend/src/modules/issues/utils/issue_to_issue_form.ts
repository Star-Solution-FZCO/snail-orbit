import { CreateIssueT, IssueT } from "../../../types";

export const issueToIssueForm = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue.project.id,
    fields: issue.fields,
});
