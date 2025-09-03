import type { IssueT } from "shared/model/types";

export type IssueRowViewParams = {
    showSubscribeButton?: boolean;
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
    showUpdateTime?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
} & IssueRowViewParams;
