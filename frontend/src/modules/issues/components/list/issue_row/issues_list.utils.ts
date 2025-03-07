import type { IssueRowViewParams } from "./issue_row.types";

export const issueListSettingOptions: Record<
    string,
    IssueRowViewParams & { label: string }
> = {
    small: {
        label: "S",
        showDescription: false,
        showCustomFields: false,
        showDividers: false,
    },
    medium: {
        label: "M",
        showDescription: false,
        showCustomFields: true,
        showDividers: true,
    },
    large: {
        label: "L",
        showDescription: true,
        showCustomFields: true,
        showDividers: true,
    },
};

export const perPageOptions = [5, 10, 15, 20, 50];
