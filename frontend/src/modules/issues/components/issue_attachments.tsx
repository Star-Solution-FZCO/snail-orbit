import AttachFileIcon from "@mui/icons-material/AttachFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Box,
    Collapse,
    IconButton,
    LinearProgress,
    Typography,
} from "@mui/material";
import { FC, useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast, TypeOptions } from "react-toastify";
import { issueApi, sharedApi } from "store";
import { AttachmentT, SelectedAttachmentT } from "types";
import { toastApiError } from "utils";
import { initialSelectedAttachment } from "../utils";
import { AttachmentCard, BrowserFileCard } from "./attachment_cards";
import { DeleteAttachmentDialog } from "./delete_attachment_dialog";
import { IssueFormData } from "./issue_form";

const useToast = () => {
    const toastId = useRef<string | number | null>(null);

    const showToast = (fileName: string) => {
        toastId.current = toast(
            <Box display="flex" flexDirection="column" gap={1}>
                <Typography>{fileName}</Typography>
                <LinearProgress />
            </Box>,
            {
                closeOnClick: false,
                closeButton: false,
                hideProgressBar: true,
            },
        );
    };

    const updateToast = (
        message: string,
        type: TypeOptions,
        autoClose: number,
    ) => {
        if (toastId.current) {
            toast.update(toastId.current, {
                render: <Typography>{message}</Typography>,
                onClose: () => (toastId.current = null),
                isLoading: false,
                autoClose,
                type,
            });
        }
    };

    return { toastId, showToast, updateToast };
};

interface IIssueAttachmentsProps {
    issueId?: string;
    issueAttachments?: AttachmentT[];
}

const IssueAttachments: FC<IIssueAttachmentsProps> = ({
    issueId,
    issueAttachments = [],
}) => {
    const { t } = useTranslation();

    const { setValue, watch } = useFormContext<IssueFormData>();
    const formAttachments = watch("attachments") || [];

    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();
    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const [files, setFiles] = useState<File[]>([]);
    const [attachmentsExpanded, setAttachmentsExpanded] = useState(true);
    const [selectedAttachment, setSelectedAttachment] =
        useState<SelectedAttachmentT>(initialSelectedAttachment);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const { toastId, showToast, updateToast } = useToast();

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            const formData = new FormData();
            formData.append("file", file);

            if (toastId.current === null) {
                showToast(file.name);
            }

            try {
                const response = await uploadAttachment(formData).unwrap();

                setTimeout(() => {
                    if (issueId) {
                        updateIssue({
                            id: issueId,
                            attachments: [
                                ...issueAttachments.map(
                                    (attachment) => attachment.id,
                                ),
                                response.payload.id,
                            ],
                        })
                            .unwrap()
                            .catch(toastApiError);
                    } else {
                        setFiles((prevFiles) => [...prevFiles, file]);
                    }

                    setValue("attachments", [
                        ...formAttachments,
                        response.payload.id,
                    ]);

                    updateToast(
                        t("issues.form.attachments.upload.success"),
                        "success",
                        3000,
                    );
                }, 1000);
            } catch (error) {
                setTimeout(() => {
                    toastApiError(error);
                    updateToast(
                        t("issues.form.attachments.upload.error"),
                        "error",
                        3000,
                    );
                }, 1000);
            }
        },
        [
            formAttachments,
            issueAttachments,
            issueId,
            setValue,
            uploadAttachment,
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
        setValue(
            "attachments",
            formAttachments.filter((_, i) => i !== selectedAttachment.id),
        );
        setOpenDeleteDialog(false);
    };

    const deleteAttachment = () => {
        if (!issueId) return;
        if (!selectedAttachment) return;
        if (selectedAttachment.type !== "server") return;

        updateIssue({
            id: issueId,
            attachments: issueAttachments
                .filter((attachment) => attachment.id !== selectedAttachment.id)
                .map((attachment) => attachment.id),
        })
            .unwrap()
            .then((response) => {
                setValue(
                    "attachments",
                    response.payload.attachments.map(
                        (attachment) => attachment.id,
                    ),
                );
                setOpenDeleteDialog(false);
            })
            .catch(toastApiError);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    });

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
                                key={file.name}
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
                loading={updateLoading}
            />
        </Box>
    );
};

export { IssueAttachments };
