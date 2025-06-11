import type { IssueT } from "shared/model/types";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
} & IssueRowViewParams;
