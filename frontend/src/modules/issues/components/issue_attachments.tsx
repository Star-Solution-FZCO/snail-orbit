import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, LinearProgress, Typography } from "@mui/material";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { sharedApi } from "store";
import { toastApiError } from "utils";
import { IssueFormData } from "./issue_form";

const IssueAttachments = () => {
    const { t } = useTranslation();

    const { setValue, watch } = useFormContext<IssueFormData>();
    const attachments = watch("attachments") || [];

    const toastId = useRef<string | number | null>(null);

    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();

    const [files, setFiles] = useState<File[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 1) return;

            const file = acceptedFiles[0];
            const formData = new FormData();

            formData.append("file", file);

            if (toastId.current === null) {
                toastId.current = toast(
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography>{file.name}</Typography>
                        <LinearProgress />
                    </Box>,
                    {
                        closeOnClick: false,
                        closeButton: false,
                        position: "bottom-right",
                        progress: 0,
                    },
                );
            }

            uploadAttachment(formData)
                .unwrap()
                .then((response) => {
                    setFiles([...files, file]);
                    setValue("attachments", [
                        ...attachments,
                        response.payload.id,
                    ]);
                    toastId.current && toast.dismiss(toastId.current);
                })
                .catch(toastApiError);
        },
        [attachments, setValue, uploadAttachment],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
    });

    return (
        <Box display="flex" flexDirection="column" gap={1}>
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
                    {t("issues.form.attachments.dragFilesHere")}
                </Typography>
            </Box>

            <Box></Box>
        </Box>
    );
};

export { IssueAttachments };
