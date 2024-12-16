import { Pagination, Stack } from "@mui/material";
import type { FC } from "react";
import type { IssueT } from "types/issue";
import IssueRow from "./issue_row/issue_row";
import type { IssueRowViewParams } from "./issue_row/issue_row.types";

type IssuesListProps = {
    issues: IssueT[];
    pageCount: number;
    page: number;
    onChangePage?: (page: number) => void;
    viewSettings?: IssueRowViewParams;
};

export const IssuesList: FC<IssuesListProps> = ({
    issues,
    page,
    onChangePage,
    pageCount,
    viewSettings,
}) => {
    return (
        <Stack>
            {issues.map((issue) => (
                <IssueRow issue={issue} {...viewSettings} />
            ))}
            {pageCount && (
                <Pagination
                    size="small"
                    sx={{ mx: "auto", mt: 2 }}
                    count={pageCount}
                    page={page}
                    onChange={(_, newPage) => onChangePage?.(newPage)}
                />
            )}
        </Stack>
    );
};

export default IssuesList;
