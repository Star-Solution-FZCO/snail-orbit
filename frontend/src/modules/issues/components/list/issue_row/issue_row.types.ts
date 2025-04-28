import type { IssueT, UpdateIssueT } from "shared/model/types";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
    onUpdateIssue?: (issue: { id: string } & UpdateIssueT) => unknown;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
} & IssueRowViewParams;
