import { Divider, Pagination, Stack } from "@mui/material";
import type { FC } from "react";
import React, { useMemo } from "react";
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
    const rows = useMemo(() => {
        const res = issues.map((issue, index) => (
            <React.Fragment key={issue.id}>
                <IssueRow issue={issue} {...viewSettings} />
                {viewSettings?.showDividers && index !== issues.length - 1 && (
                    <Divider />
                )}
            </React.Fragment>
        ));
        return res;
    }, [issues, viewSettings]);

    return (
        <Stack>
            <>{rows}</>

            {pageCount > 1 ? (
                <Pagination
                    size="small"
                    sx={{ mx: "auto", mt: 2 }}
                    count={pageCount}
                    page={page}
                    onChange={(_, newPage) => onChangePage?.(newPage)}
                />
            ) : null}
        </Stack>
    );
};

export default IssuesList;
