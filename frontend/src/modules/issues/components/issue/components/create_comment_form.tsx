import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import { MDEditor, SpentTimeField, UserAvatar } from "components";
import type { ChangeEvent, FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, useAppSelector } from "store";
import { formatSpentTime, toastApiError } from "utils";
import { useFileUploader } from "../../../../../widgets/file_upload/useFileUploader";
import { BrowserFileCard } from "./attachment_cards";
import { HiddenInput } from "./hidden_input";

interface IUnsavedChangesDialogProps {
    open: boolean;
    onClose: () => void;
    onDiscard: () => void;
}

const UnsavedChangesDialog: FC<IUnsavedChangesDialogProps> = ({
    open,
    onClose,
    onDiscard,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("issues.comments.unsavedChanges.title")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {t("issues.comments.unsavedChanges.warning")}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>
                <Button onClick={onDiscard} variant="outlined">
                    {t("issues.comments.unsavedChanges.discard")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface ICreateCommentFormProps {
    issueId: string;
}

const CreateCommentForm: FC<ICreateCommentFormProps> = ({ issueId }) => {
    const { t } = useTranslation();

    const user = useAppSelector((state) => state.profile.user);

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [text, setText] = useState("");
    const [spentTime, setSpentTime] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
        useState(false);

    const [createComment, { isLoading }] =
        issueApi.useCreateIssueCommentMutation();

    const handleClickAddComment = () => {
        createComment({
            id: issueId,
            text,
            spent_time: spentTime,
            attachments,
        })
            .unwrap()
            .then(() => {
                setText("");
                setMode("view");
            })
            .catch(toastApiError);
    };

    const { uploadFile } = useFileUploader();

    const handleUploadFiles = useCallback(
        async (files: File[]) => {
            const newAttachmentIds = await Promise.all(files.map(uploadFile));

            setFiles((prev) => [...prev, ...files]);
            setAttachments((prev) => [...prev, ...newAttachmentIds]);
        },
        [uploadFile],
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
                window.removeEventListener("paste", handlePaste);
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
                                loading={isLoading}
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
