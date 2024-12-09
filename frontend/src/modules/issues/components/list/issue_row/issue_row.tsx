import { Stack } from "@mui/material";
import { IssueLink } from "components/issue_link";
import type { FC } from "react";
import { memo } from "react";
import type { IssueT } from "types/issue";
import { IssueRowHeader, IssueRowRoot } from "./issue_row.styles";
import { IssueRowFields } from "./issue_row_fields";
import { UpdateTime } from "./update_time";

type IssueRowProps = {
    issue: IssueT;
};

export const IssueRow: FC<IssueRowProps> = memo(({ issue }) => {
    const { subject, id_readable } = issue;

    return (
        <IssueRowRoot tabIndex={0}>
            <IssueRowHeader>
                <Stack direction="row" gap={1} flexWrap="nowrap">
                    <IssueLink to={`/issues/${id_readable}`}>
                        {id_readable}
                    </IssueLink>
                    <span>{subject}</span>
                </Stack>
                <UpdateTime issue={issue} />
            </IssueRowHeader>
            {/*<IssueRowBody>{text}</IssueRowBody> TODO: return*/}
            <IssueRowFields issue={issue} />
        </IssueRowRoot>
    );
});

export default IssueRow;
