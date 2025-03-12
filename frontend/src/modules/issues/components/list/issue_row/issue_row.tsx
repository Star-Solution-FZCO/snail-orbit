import { Stack } from "@mui/material";
import { IssueLink } from "components/issue_link";
import type { FC } from "react";
import { memo } from "react";
import { slugify } from "transliteration";
import { IssueTags } from "../../issue/issue_tags";
import { IssueRowBody, IssueRowHeader, IssueRowRoot } from "./issue_row.styles";
import type { IssueRowProps } from "./issue_row.types";
import { IssueRowFields } from "./issue_row_fields";
import { UpdateTime } from "./update_time";

export const IssueRow: FC<IssueRowProps> = memo(
    ({ issue, showCustomFields, showDescription, onUpdateIssue }) => {
        const { subject, id_readable, text } = issue;

        return (
            <IssueRowRoot tabIndex={0}>
                <IssueRowHeader>
                    <Stack
                        direction="row"
                        gap={1}
                        flexWrap="nowrap"
                        alignItems="center"
                    >
                        <IssueLink
                            to={`/issues/${id_readable}/${slugify(issue.subject)}`}
                            lineThrough={issue.is_resolved}
                            resolved={issue.is_resolved}
                        >
                            {id_readable}
                        </IssueLink>

                        <IssueLink
                            to={`/issues/${id_readable}/${slugify(issue.subject)}`}
                            resolved={issue.is_resolved}
                        >
                            {subject}
                        </IssueLink>

                        <IssueTags issue={issue} />
                    </Stack>

                    <UpdateTime issue={issue} />
                </IssueRowHeader>

                {showDescription && <IssueRowBody>{text}</IssueRowBody>}
                {showCustomFields && (
                    <IssueRowFields
                        onUpdateIssue={onUpdateIssue}
                        issue={issue}
                    />
                )}
            </IssueRowRoot>
        );
    },
);

export default IssueRow;
