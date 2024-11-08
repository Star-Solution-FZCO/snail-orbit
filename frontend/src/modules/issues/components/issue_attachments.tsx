import AttachFileIcon from "@mui/icons-material/AttachFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { sharedApi } from "store";
import { IssueT, SelectedAttachmentT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { initialSelectedAttachment, useUploadToast } from "../utils";
import { AttachmentCard, BrowserFileCard } from "./attachment_cards";
import { DeleteAttachmentDialog } from "./delete_attachment_dialog";

interface IIssueAttachmentsProps {
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
}

const IssueAttachments: FC<IIssueAttachmentsProps> = ({
    issue,
    onUpdateIssue,
    onUpdateCache,
}) => {
    const { t } = useTranslation();

    const { attachments: issueAttachments, id: issueId } = issue;
    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();

    const [files, setFiles] = useState<File[]>([]);
    const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const { toastId, showToast, updateToast, activeMutations } =
        useUploadToast();

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

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newAttachmentIds = await Promise.all(
                acceptedFiles.map(uploadFile),
            );

            const updatedAttachments = [
                ...issueAttachments.map((attachment) => attachment.id),
                ...newAttachmentIds,
            ];

            await onUpdateIssue({
                attachments: updatedAttachments,
            });
        },
        [
            issueAttachments,
            issueId,
            uploadAttachment,
            showToast,
            updateToast,
            activeMutations,
            onUpdateIssue,
        ],
    );

    const handlePaste = useCallback(
        async (event: ClipboardEvent) => {
            const clipboardItems = event.clipboardData?.items;
            if (!clipboardItems) return;

            for (let i = 0; i < clipboardItems.length; i++) {
                const item = clipboardItems[i];

                if (item.kind === "file") {
                    const file = item.getAsFile();

                    if (!file) continue;

                    const attachmentId = await uploadFile(file);
                    const updatedAttachments = [
                        ...issueAttachments.map((attachment) => attachment.id),
                        attachmentId,
                    ];

                    await onUpdateIssue({
                        attachments: updatedAttachments,
                    });
                }
            }
        },
        [
            issueAttachments,
            issueId,
            uploadAttachment,
            showToast,
            updateToast,
            activeMutations,
            onUpdateIssue,
        ],
    );

    const handleClickDeleteBrowserFile = (index: number, filename: string) => {
        setSelectedAttachment({ id: index, filename, type: "browser" });
        setOpenDeleteDialog(true);
    };

    const handleClickDeleteIssueAttachment = (id: string, filename: string) => {
        setSelectedAttachment({ id, filename, type: "server" });
        setOpenDeleteDialog(true);
    };

    const deleteBrowserFile = () => {
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "browser") return;

        setFiles((prevFiles) =>
            prevFiles.filter((_, i) => i !== selectedAttachment.id),
        );
        setOpenDeleteDialog(false);
    };

    const deleteAttachment = () => {
        if (!issueId) return;
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "server") return;

        onUpdateIssue({
            attachments: issueAttachments
                .filter((attachment) => attachment.id !== selectedAttachment.id)
                .map((attachment) => attachment.id),
        });

        onUpdateCache({
            attachments: issueAttachments.filter(
                (attachment) => attachment.id !== selectedAttachment.id,
            ),
        });

        setOpenDeleteDialog(false);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    useEffect(() => {
        window.addEventListener("paste", handlePaste);

        return () => {
            window.removeEventListener("paste", handlePaste);
        };
    }, [handlePaste]);

    const attachmentsExists = files.length > 0 || issueAttachments.length > 0;

    return (
        <Box display="flex" flexDirection="column">
            {attachmentsExists && (
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <IconButton
                        sx={{ p: 0 }}
                        onClick={() =>
                            setAttachmentsExpanded(!attachmentsExpanded)
                        }
                        size="small"
                    >
                        <ExpandMoreIcon
                            sx={{
                                transform: attachmentsExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0)",
                                transition: "transform 0.2s",
                            }}
                            fontSize="small"
                        />
                    </IconButton>

                    <Typography fontWeight="bold">
                        {t("issues.form.attachments.title")}{" "}
                        <Typography component="span" color="text.secondary">
                            ({files.length + issueAttachments.length})
                        </Typography>
                    </Typography>
                </Box>
            )}

            <Box
                {...getRootProps()}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: isDragActive ? "primary.main" : "grey.600",
                    borderRadius: 0.5,
                    backgroundColor: isDragActive
                        ? "action.selected"
                        : "transparent",
                    p: 1,
                    cursor: "pointer",
                }}
            >
                <input {...getInputProps()} />

                <AttachFileIcon />

                <Typography>
                    {t("issues.form.attachments.dragFileHere")}
                </Typography>
            </Box>

            {attachmentsExists && (
                <Collapse in={attachmentsExpanded}>
                    <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                        {issueAttachments.map((attachment) => (
                            <AttachmentCard
                                key={attachment.id}
                                attachment={attachment}
                                onDelete={() =>
                                    handleClickDeleteIssueAttachment(
                                        attachment.id,
                                        attachment.name,
                                    )
                                }
                            />
                        ))}

                        {files.map((file, index) => (
                            <BrowserFileCard
                                key={`${file.name}-${index}`}
                                file={file}
                                onDelete={() =>
                                    handleClickDeleteBrowserFile(
                                        index,
                                        file.name,
                                    )
                                }
                            />
                        ))}
                    </Box>
                </Collapse>
            )}

            <DeleteAttachmentDialog
                open={openDeleteDialog}
                filename={selectedAttachment.filename}
                onClose={() => setOpenDeleteDialog(false)}
                onDelete={
                    selectedAttachment.type === "browser"
                        ? deleteBrowserFile
                        : deleteAttachment
                }
            />
        </Box>
    );
};

export { IssueAttachments };
