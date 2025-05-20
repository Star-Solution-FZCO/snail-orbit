import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
    onUpdateIssue?: (issue: IssueUpdate) => unknown;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
} & IssueRowViewParams;
