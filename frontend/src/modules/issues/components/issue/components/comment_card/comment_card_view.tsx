import { Box, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "shared/date";
import { useAppSelector } from "shared/model";
import type { CommentT, IssueAttachmentT } from "shared/model/types";
import { MarkdownRenderer, UserAvatar } from "shared/ui";
import { formatSpentTime } from "shared/utils";
import { AttachmentCard } from "../attachment_cards";
import { CommentCardActionButtons } from "./comment_card_action_buttons";

type CommentCardViewProps = {
    issueId: string;
    issueSubject: string;
    comment: CommentT;
    commentText: string;
    onEditClick: (comment: CommentT) => unknown;
    onDeleteClick: (comment: CommentT) => unknown;
    onDeleteAttachment: (id: string, filename: string) => unknown;
    onDownloadAttachment: (attachment: IssueAttachmentT) => unknown;
    isLoading?: boolean;
};

export const CommentCardView = (props: CommentCardViewProps) => {
    const {
        issueId,
        issueSubject,
        comment,
        commentText,
        onDeleteClick,
        onEditClick,
        isLoading,
        onDeleteAttachment,
        onDownloadAttachment,
    } = props;

    const commentBoxRef = useRef<null | HTMLDivElement>(null);

    const { t } = useTranslation();

    const user = useAppSelector((state) => state.profile.user);

    const author = comment.author;
    const isOwner = user?.id === author.id;
    const attachmentsExists = comment.attachments.length > 0;

    useEffect(() => {
        const hash = location.hash;

        if (hash === `#comment-${comment.id}`) {
            const element = commentBoxRef.current;
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
        }
    }, [comment.id]);

    return (
        <Box
            ref={commentBoxRef}
            id={`comment-${comment.id}`}
            tabIndex={0}
            sx={{
                display: "flex",
                gap: 2,
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                "&:focus": {
                    backgroundColor: "action.focus",
                    outline: "none",
                },
                "&:hover": {
                    backgroundColor: "action.hover",
                    "& .actions": {
                        display: "flex",
                    },
                },
            }}
        >
            <UserAvatar src={author.avatar} size={32} isBot={author.is_bot} />

            <Box width="100%" fontSize={14}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                >
                    <Box
                        height="24px"
                        display="flex"
                        alignItems="center"
                        gap={1}
                    >
                        <Typography fontSize="inherit">
                            {author.name}
                        </Typography>

                        <Tooltip
                            title={dayjs
                                .utc(comment.created_at)
                                .local()
                                .format("DD MMM YYYY HH:mm")}
                            placement="top"
                        >
                            <Typography
                                fontSize="inherit"
                                color="text.secondary"
                            >
                                {t("issues.comments.commented")}{" "}
                                {dayjs
                                    .utc(comment.created_at)
                                    .local()
                                    .fromNow()}
                            </Typography>
                        </Tooltip>
                    </Box>

                    <CommentCardActionButtons
                        issueId={issueId}
                        issueSubject={issueSubject}
                        comment={comment}
                        onEdit={onEditClick}
                        onDelete={onDeleteClick}
                        isModifyActionsAvailable={isOwner && !isLoading}
                    />
                </Box>

                {comment.spent_time > 0 && (
                    <Typography fontSize="inherit" color="text.secondary">
                        {t("issues.spentTime")}:{" "}
                        <Typography
                            component="span"
                            fontSize="inherit"
                            fontWeight="bold"
                            color="text.primary"
                        >
                            {formatSpentTime(comment.spent_time, true)}
                        </Typography>
                    </Typography>
                )}

                <Box mt={0.5}>
                    <MarkdownRenderer content={commentText} />
                </Box>

                {attachmentsExists && (
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {comment.attachments.map((attachment) => (
                            <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                                onDelete={() =>
                                    onDeleteAttachment(
                                        attachment.id,
                                        attachment.name,
                                    )
                                }
                                onDownload={onDownloadAttachment}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};
