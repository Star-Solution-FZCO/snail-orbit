import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, Button, TextField } from "@mui/material";
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "shared/model";
import type { IssueAttachmentBodyT } from "shared/model/types";
import { MDEditor, SpentTimeField, UserAvatar } from "shared/ui";
import { formatSpentTime, toastApiError } from "shared/utils";
import { useIssueOperations } from "../../../../api/use_issue_operations";
import { BrowserFileCard } from "../attachment_cards";
import { HiddenInput } from "../hidden_input";
import { UnsavedChangesDialog } from "./unsaved_changed_dialog";

type CreateCommentFormProps = {
    issueId: string;
};

const CreateCommentForm: FC<CreateCommentFormProps> = ({ issueId }) => {
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

    const {
        createComment,
        isLoading,
        isCommentCreateLoading,
        uploadAttachment,
    } = useIssueOperations({
        issueId,
    });

    const handleClickAddComment = () => {
        createComment({
            id: issueId,
            text,
            spent_time: spentTime,
            attachments,
        })
            .then(() => {
                setText("");
                setMode("view");
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

    const handleDiscardChanges = () => {
        setText("");
        setSpentTime(0);
        setFiles([]);
        setDiscardChangesDialogOpen(false);
        setMode("view");
    };

    if (mode === "view")
        return (
            <Box display="flex" gap={2}>
                <UserAvatar src={user?.avatar || ""} size={32} />

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
                    <UserAvatar src={user?.avatar || ""} size={32} />

                    <Box display="flex" flexDirection="column" gap={1} flex={1}>
                        <MDEditor
                            value={text}
                            onChange={(value) => setText(value || "")}
                            placeholder={t("issues.comments.write")}
                            autoFocus
                            autoHeight
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
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
                                initialValue={
                                    spentTime
                                        ? formatSpentTime(spentTime)
                                        : undefined
                                }
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
