import type { IssueRowViewParams } from "./issue_row.types";

export const defaultIssueRowViewParams: IssueRowViewParams = {
    showCustomFields: true,
    showDescription: false,
    showDividers: true,
};

export const perPageOptions = [10, 25, 50, 100, 500, 1000];
