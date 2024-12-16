import type { IssueT } from "types";

export type IssueRowViewParams = {
    showCustomFields?: boolean;
    showDescription?: boolean;
};

export type IssueRowProps = {
    issue: IssueT;
} & IssueRowViewParams;
