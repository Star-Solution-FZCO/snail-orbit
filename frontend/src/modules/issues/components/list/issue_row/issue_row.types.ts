import type { IssueT } from "types";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
    showDividers?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
} & IssueRowViewParams;
