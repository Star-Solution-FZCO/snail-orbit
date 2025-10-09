import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, Button } from "@mui/material";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
    CommentT,
    IssueAttachmentBodyT,
    IssueAttachmentT,
} from "shared/model/types";
import type { IssueCommentUpdate } from "shared/model/types/backend-schema.gen";
import { MDEditor, SpentTimeField, UserAvatar } from "shared/ui";
import { AttachmentCard } from "../attachment_cards";
import { HiddenInput } from "../hidden_input";

type CommentCardEditProps = {
    comment: CommentT;
    commentText: string;
    updateComment?: (params: IssueCommentUpdate) => unknown;
    onClose?: () => unknown;
    isLoading?: boolean;
    onDeleteAttachment: (id: string, filename: string) => unknown;
    onDownloadAttachment: (attachment: IssueAttachmentT) => unknown;
    onUploadAttachment: (file: File) => Promise<IssueAttachmentBodyT>;
};

export const CommentCardEdit = (props: CommentCardEditProps) => {
    const {
        commentText,
        comment,
        updateComment,
        isLoading,
        onDeleteAttachment,
        onDownloadAttachment,
        onUploadAttachment,
        onClose,
    } = props;
    const { t } = useTranslation();

    const [text, setText] = useState(commentText);
    const [spentTime, setSpentTime] = useState(comment.spent_time);
    const [isFocused, setIsFocused] = useState(false);

    const author = comment.author;
    const attachmentsExists = comment.attachments.length > 0;

    const handleSave = () => {
        updateComment?.({ text: { value: text }, spent_time: spentTime });
        onClose?.();
    };

    const handleUploadFiles = useCallback(
        async (files: File[]) => {
            const newAttachments = await Promise.all(
                Array.from(files).map(onUploadAttachment),
            );

            await updateComment?.({
                attachments: [...comment.attachments, ...newAttachments],
            });
        },
        [onUploadAttachment, updateComment, comment.attachments],
    );

    const handleChangeFileInput = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files) return;

            await handleUploadFiles(Array.from(files));
        },
        [handleUploadFiles],
    );

    const handlePaste = useCallback(
        async (event: ClipboardEvent) => {
            const clipboardItems = event.clipboardData?.items;

            if (!clipboardItems) return;

            const files = Array.from(clipboardItems)
                .map((item) => item.getAsFile())
                .filter((file) => !!file);

            if (!files.length) return;

            event.stopPropagation();
            event.preventDefault();

            await handleUploadFiles(files);
        },
        [handleUploadFiles],
    );

    useEffect(() => {
        if (isFocused) {
            window.addEventListener("paste", handlePaste, { capture: true });

            return () => {
                window.removeEventListener("paste", handlePaste, {
                    capture: true,
                });
            };
        }
    }, [handlePaste, isFocused]);

    return (
        <Box display="flex" flexDirection="column" pl={1} py={0.5}>
            <Box display="flex" gap={2}>
                <UserAvatar src={author.avatar} size={32} />

                <Box display="flex" flexDirection="column" gap={1} flex={1}>
                    <MDEditor
                        value={text}
                        onChange={setText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={t("issues.comments.write")}
                        autoFocus
                        autoHeight
                    />

                    <Box display="flex" gap={1}>
                        <Button
                            onClick={handleSave}
                            variant="outlined"
                            size="small"
                            disabled={!text}
                            loading={isLoading}
                        >
                            {t("save")}
                        </Button>

                        <Button
                            component="label"
                            startIcon={<AttachFileIcon />}
                            variant="outlined"
                            size="small"
                            color="secondary"
                        >
                            {t("issues.comments.attachFile")}

                            <HiddenInput
                                type="file"
                                onChange={handleChangeFileInput}
                                multiple
                            />
                        </Button>

                        <SpentTimeField
                            label={t("issues.spentTime")}
                            initialValue={spentTime}
                            onChange={setSpentTime}
                        />

                        <Button
                            onClick={onClose}
                            variant="outlined"
                            size="small"
                            color="error"
                        >
                            {t("cancel")}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {attachmentsExists && (
                <Box display="flex" flexWrap="wrap" gap={1} mt={1} ml={6}>
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
    );
};
