import { Stack } from "@mui/material";
import type { FC } from "react";
import { memo, useCallback } from "react";
import { IssueLink } from "shared/ui/issue_link";
import { slugify } from "transliteration";
import { IssueSubscribeButton } from "../../issue/components/issue_subscribe_button";
import { IssueTags } from "../../issue/components/issue_tags";
import { IssueRowBody, IssueRowHeader, IssueRowRoot } from "./issue_row.styles";
import type { IssueRowProps } from "./issue_row.types";
import { IssueRowFields } from "./issue_row_fields";
import { UpdateTime } from "./update_time";

export const IssueRow: FC<IssueRowProps> = memo(
    ({ issue, showCustomFields, showDescription, onIssueRowDoubleClick }) => {
        const { subject, id_readable, text } = issue;

        const handleDoubleClick = useCallback(() => {
            onIssueRowDoubleClick?.(issue);
        }, [issue, onIssueRowDoubleClick]);

        return (
            <IssueRowRoot tabIndex={0} onDoubleClick={handleDoubleClick}>
                <IssueRowHeader>
                    <Stack
                        direction="row"
                        gap={1}
                        flexWrap="nowrap"
                        alignItems="center"
                    >
                        <IssueSubscribeButton issue={issue} />

                        <IssueLink
                            to="/issues/$issueId/$subject"
                            params={{
                                issueId: id_readable,
                                subject: slugify(issue.subject),
                            }}
                            lineThrough={issue.is_resolved}
                            resolved={issue.is_resolved}
                        >
                            {id_readable}
                        </IssueLink>

                        <IssueLink
                            to="/issues/$issueId/$subject"
                            params={{
                                issueId: id_readable,
                                subject: slugify(issue.subject),
                            }}
                            resolved={issue.is_resolved}
                        >
                            {subject}
                        </IssueLink>

                        <IssueTags issue={issue} />
                    </Stack>

                    <UpdateTime issue={issue} />
                </IssueRowHeader>

                {showDescription && !text?.encryption?.length && (
                    <IssueRowBody>{text?.value}</IssueRowBody>
                )}
                {showCustomFields && <IssueRowFields issue={issue} />}
            </IssueRowRoot>
        );
    },
);

export default IssueRow;
