import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
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
import { MDEditor, UserAvatar } from "components";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, sharedApi, useAppSelector } from "store";
import { toastApiError } from "utils";
import { useUploadToast } from "../utils";
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
    const [text, setText] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [discardChangesDialogOpen, setDiscardChangesDialogOpen] =
        useState(false);

    const [createComment, { isLoading }] =
        issueApi.useCreateIssueCommentMutation();
    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();

    const { toastId, showToast, updateToast, activeMutations } =
        useUploadToast();

    const handleClickAddComment = () => {
        createComment({
            id: issueId,
            text,
            attachments,
        })
            .unwrap()
            .then(() => {
                setText("");
                setMode("view");
            })
            .catch(toastApiError);
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        if (!toastId.current[file.name]) {
            showToast(file.name);
        }

        try {
            const mutation = uploadAttachment(formData);
            activeMutations.current[file.name] = mutation;
            const response = await mutation.unwrap();

            return response.payload.id;
        } catch (error: any) {
            if (error.name !== "AbortError") {
                toastApiError(error);
                updateToast(
                    file.name,
                    t("issues.form.attachments.upload.error"),
                    "error",
                    3000,
                );
            }
            throw error;
        }
    };

    const handleChangeFileInput = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (!files) return;

            const newAttachmentIds = await Promise.all(
                Array.from(files).map(uploadFile),
            );

            setFiles((prev) => [...prev, ...files]);
            setAttachments((prev) => [...prev, ...newAttachmentIds]);
        },
        [
            uploadAttachment,
            showToast,
            updateToast,
            activeMutations,
            setFiles,
            setAttachments,
        ],
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
        if (text || files.length > 0) setDiscardChangesDialogOpen(true);
        else setMode("view");
    };

    const handleDiscardChanges = () => {
        setText("");
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
                        />

                        <Box display="flex" gap={1}>
                            <LoadingButton
                                onClick={handleClickAddComment}
                                variant="outlined"
                                size="small"
                                disabled={!text && files.length === 0}
                                loading={isLoading}
                            >
                                {t("issues.comments.add")}
                            </LoadingButton>

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
