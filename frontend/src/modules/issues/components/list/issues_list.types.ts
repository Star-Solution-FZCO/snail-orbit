import type { IssueT, UpdateIssueT } from "types";

export type IssuesListProps = {
    issues: IssueT[];
    pageCount: number;
    page: number;
    perPage: number;
    onChangePage?: (page: number) => void;
    onChangePerPage?: (perPage: number) => void;
    totalCount?: number;
    onUpdateIssue?: (issue: { id: string } & UpdateIssueT) => unknown;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
};
