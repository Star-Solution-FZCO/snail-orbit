import { Stack } from "@mui/material";
import { IssueLink } from "entities/issue/issue_link/issue_link";
import type { FC } from "react";
import { memo, useCallback } from "react";
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
                        flexWrap="nowrap"
                        alignItems="center"
                        gap={1}
                        minWidth={0}
                        flex={1}
                    >
                        <IssueSubscribeButton issue={issue} />

                        <IssueLink
                            issue={issue}
                            lineThrough={issue.is_resolved}
                            resolved={issue.is_resolved}
                            flexShrink={0}
                        >
                            {id_readable}
                        </IssueLink>

                        <IssueLink
                            issue={issue}
                            title={subject}
                            resolved={issue.is_resolved}
                            overflow="hidden"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
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
