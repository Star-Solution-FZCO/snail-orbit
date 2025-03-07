import type { IssueT, UpdateIssueT } from "types";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
    onUpdateIssue?: (issue: { id: string } & UpdateIssueT) => unknown;
} & IssueRowViewParams;
