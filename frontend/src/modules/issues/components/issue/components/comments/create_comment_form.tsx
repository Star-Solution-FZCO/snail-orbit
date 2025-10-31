import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, Button, TextField } from "@mui/material";
import { useAttachmentOperations } from "entities/issue/api/use_attachment_operations";
import { useCommentOperations } from "entities/issue/api/use_comment_operations";
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "shared/model";
import type { IssueAttachmentBodyT } from "shared/model/types";
import { MDEditor, SpentTimeField, UserAvatar } from "shared/ui";
import { toastApiError } from "shared/utils";
import { BrowserFileCard } from "../attachment_cards";
import { HiddenInput } from "../hidden_input";
import { UnsavedChangesDialog } from "./unsaved_changed_dialog";

type CreateCommentFormProps = {
    issueId: string;
    projectId?: string;
};

const CreateCommentForm: FC<CreateCommentFormProps> = ({
    issueId,
    projectId,
}) => {
    const { t } = useTranslation();

    const user = useAppSelector((state) => state.profile.user);

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [text, setText] = useState("");
    const [spentTime, setSpentTime] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<IssueAttachmentBodyT[]>([]);

    const [isFocused, setIsFocused] = useState(false);
    const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
        useState(false);

    const { createComment, isLoading, isCommentCreateLoading } =
        useCommentOperations({
            projectId,
        });

    const { uploadAttachment } = useAttachmentOperations({ projectId });

    const handleClickAddComment = () => {
        createComment({
            id: issueId,
            text: {
                value: text,
            },
            spent_time: spentTime,
            attachments,
        })
            .then(() => {
                setMode("view");
                setText("");
                setSpentTime(0);
                setFiles([]);
                setAttachments([]);
            })
            .catch(toastApiError);
    };

    const handleUploadFiles = useCallback(
        async (files: File[]) => {
            const newAttachments = await Promise.all(
                files.map(uploadAttachment),
            );

            setFiles((prev) => [...prev, ...files]);
            setAttachments((prev) => [...prev, ...newAttachments]);
        },
        [uploadAttachment],
    );

    const handleChangeFileInput = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files) return;

            await handleUploadFiles(Array.from(files));
        },
        [handleUploadFiles],
    );

    const handleClickDeleteFileAttachment = (
        index: number,
        filename: string,
    ) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setAttachments((prev) =>
            prev.filter((_, i) => files[i].name !== filename),
        );
    };

    const handleClickCancel = () => {
        if (text || spentTime || files.length > 0)
            setDiscardChangesDialogOpen(true);
        else setMode("view");
    };

    const handleDiscardChanges = () => {
        setDiscardChangesDialogOpen(false);
        setMode("view");
        setText("");
        setSpentTime(0);
        setFiles([]);
        setAttachments([]);
    };

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

    if (mode === "view")
        return (
            <Box display="flex" gap={2}>
                <UserAvatar
                    src={user?.avatar || ""}
                    size={32}
                    isBot={user?.is_bot}
                />

                <TextField
                    onClick={() => setMode("edit")}
                    placeholder={t("issues.comments.write")}
                    variant="outlined"
                    size="small"
                    fullWidth
                />
            </Box>
        );

    if (mode === "edit")
        return (
            <Box display="flex" flexDirection="column">
                <Box display="flex" gap={2}>
                    <UserAvatar
                        src={user?.avatar || ""}
                        size={32}
                        isBot={user?.is_bot}
                    />

                    <Box display="flex" flexDirection="column" gap={1} flex={1}>
                        <MDEditor
                            value={text}
                            onChange={(value) => setText(value || "")}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={t("issues.comments.write")}
                            autoFocus
                            autoHeight
                        />

                        <Box display="flex" gap={1}>
                            <Button
                                onClick={handleClickAddComment}
                                variant="outlined"
                                size="small"
                                disabled={!text && files.length === 0}
                                loading={isLoading || isCommentCreateLoading}
                            >
                                {t("issues.comments.add")}
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
                                onClick={handleClickCancel}
                                variant="outlined"
                                size="small"
                                color="error"
                            >
                                {t("cancel")}
                            </Button>
                        </Box>
                    </Box>

                    <UnsavedChangesDialog
                        open={discardChangesDialogOpen}
                        onClose={() => setDiscardChangesDialogOpen(false)}
                        onDiscard={handleDiscardChanges}
                    />
                </Box>

                {files.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1} ml={6}>
                        {files.map((file, index) => (
                            <BrowserFileCard
                                key={`${file.name}-${index}`}
                                file={file}
                                onDelete={() =>
                                    handleClickDeleteFileAttachment(
                                        index,
                                        file.name,
                                    )
                                }
                            />
                        ))}
                    </Box>
                )}
            </Box>
        );
};

export { CreateCommentForm };
