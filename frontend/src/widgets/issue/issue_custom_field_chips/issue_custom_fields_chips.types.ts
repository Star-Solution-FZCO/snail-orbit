import type { IssueT, ProjectT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";

export type IssueCustomFieldChipsProps = {
    issue: IssueT;
    project?: ProjectT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<unknown>;
    onUpdateCache: (issueValue: Partial<IssueT>) => unknown;
};
