import { Stack } from "@mui/material";
import type { FC } from "react";
import type { IssueT } from "types/issue";
import IssueRow from "./issue_row/issue_row";

type IssuesListProps = {
    issues: IssueT[];
};

export const IssuesList: FC<IssuesListProps> = ({ issues }) => {
    return (
        <Stack>
            {issues.map((issue) => (
                <IssueRow issue={issue} />
            ))}
        </Stack>
    );
};

export default IssuesList;
