import type { IssueT } from "shared/model/types";

export type IssueRowViewParams = {
    showSubscribeButton?: boolean;
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
    showUpdateTime?: boolean;
    showVisibility?: boolean;
    customFieldSlots?: number;
};

export type IssueRowProps = {
    issue: IssueT;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
} & IssueRowViewParams;
