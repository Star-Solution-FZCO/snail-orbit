import type { IssueT, ProjectT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";

export type IssueCustomFieldsProps = {
    issue: IssueT;
    project?: ProjectT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    customFieldsErrors?: Record<string, string>;
};
