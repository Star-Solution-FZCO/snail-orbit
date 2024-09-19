import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography,
} from "@mui/material";
import { FC, useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast, TypeOptions } from "react-toastify";
import { sharedApi } from "store";
import { toastApiError } from "utils";
import { IssueFormData } from "./issue_form";

interface IAttachmentCardProps {
    file: File;
}

const AttachmentCard: FC<IAttachmentCardProps> = ({ file }) => {
    return (
        <Tooltip title={file.name} placement="bottom-start">
            <Box
                width="120px"
                height="80px"
                borderRadius={0.5}
                border={1}
                borderColor="grey.600"
                position="relative"
                sx={{
                    "&:hover .overlay": {
                        display: "flex",
                    },
                }}
            >
                <Box
                    className="overlay"
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    display="none"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    bgcolor="rgba(0, 0, 0, 0.7)"
                    borderRadius={0.5}
                >
                    <Typography
                        variant="caption"
                        color="white"
                        textAlign="center"
                        mb={1}
                    >
                        {file.name}
                    </Typography>
                    <IconButton>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>
        </Tooltip>
    );
};

const IssueAttachments = () => {
    const { t } = useTranslation();
    const { setValue, watch } = useFormContext<IssueFormData>();
    const attachments = watch("attachments") || [];

    const toastId = useRef<string | number | null>(null);
    const [uploadAttachment] = sharedApi.useUploadAttachmentMutation();
    const [files, setFiles] = useState<File[]>([]);

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
                position: "bottom-right",
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
                    setFiles((prevFiles) => [...prevFiles, file]);
                    setValue("attachments", [
                        ...attachments,
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
        [attachments, setValue, uploadAttachment, t],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
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
                    {t("issues.form.attachments.dragFileHere")}
                </Typography>
            </Box>

            {files.length > 0 && (
                <Box>
                    {files.map((file) => (
                        <AttachmentCard key={file.name} file={file} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export { IssueAttachments };
