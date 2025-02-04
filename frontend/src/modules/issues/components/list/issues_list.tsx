import { Divider, Pagination, Stack } from "@mui/material";
import type { FC } from "react";
import { useMemo } from "react";
import type { IssueT } from "types/issue";
import { interleave } from "utils/helpers/interleave";
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
        const res = issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} {...viewSettings} />
        ));

        if (viewSettings?.showDividers) return interleave(res, <Divider />);
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
