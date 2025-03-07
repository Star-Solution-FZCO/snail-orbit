import type { IssueT } from "types";

export type IssuesListProps = {
    issues: IssueT[];
    pageCount: number;
    page: number;
    perPage: number;
    onChangePage?: (page: number) => void;
    onChangePerPage?: (perPage: number) => void;
    totalCount?: number;
};
