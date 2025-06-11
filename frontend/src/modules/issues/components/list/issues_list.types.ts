import type { IssueT } from "shared/model/types";

export type IssuesListProps = {
    issues: IssueT[];
    pageCount: number;
    page: number;
    perPage: number;
    onChangePage?: (page: number) => void;
    onChangePerPage?: (perPage: number) => void;
    totalCount?: number;
    onIssueRowDoubleClick?: (issue: IssueT) => unknown;
};
