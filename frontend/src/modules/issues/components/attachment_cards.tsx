import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, Tooltip, Typography } from "@mui/material";
import { API_URL, apiVersion } from "config";
import { FC, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store";
import { IssueAttachmentT } from "types";

interface IAttachmentCardProps {
    filename: string;
    isImage: boolean;
    url: string;
    onDownload?: () => void;
    onDelete: () => void;
    canDelete?: boolean;
}

const AttachmentCard: FC<IAttachmentCardProps> = ({
    filename,
    isImage,
    url,
    onDownload,
    onDelete,
    canDelete = true,
}) => {
    const extension = filename.split(".").pop();

    const filenameCaption = useMemo(() => {
        return (
            <Typography
                className={!isImage ? "filename" : undefined}
                sx={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    textOverflow: "ellipsis",
                    fontSize: 14,
                    lineHeight: "16px",
                    wordWrap: "break-word",
                    transition: "transform .15s",
                }}
                variant="caption"
            >
                {filename}
            </Typography>
        );
    }, [filename]);

    const controls = useMemo(() => {
        return (
            <>
                {onDownload && (
                    <DownloadIcon onClick={onDownload} fontSize="small" />
                )}
                {canDelete && (
                    <DeleteIcon onClick={onDelete} fontSize="small" />
                )}
            </>
        );
    }, [onDelete, canDelete]);

    return (
        <Tooltip title={filename} placement="bottom-start">
            <Box
                width="120px"
                height="80px"
                borderRadius={0.5}
                border={1}
                borderColor="grey.600"
                position="relative"
                sx={{
                    cursor: "pointer",
                    "&:hover .overlay": {
                        display: "flex",
                    },
                    "&:hover .extension": {
                        transform: "translateY(-32px)",
                    },
                    "&:hover .filename": {
                        transform: "translateY(-24px)",
                    },
                    "&:hover .controls": {
                        transform: "translateY(0px)",
                    },
                }}
            >
                {isImage ? (
                    <Box
                        component="img"
                        src={url}
                        alt={filename}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 0.5,
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            overflow: "hidden",
                            position: "relative",
                            p: 1.5,
                        }}
                    >
                        <Typography
                            className="extension"
                            component="span"
                            sx={{
                                height: "20px",
                                fontSize: 12,
                                lineHeight: "20px",
                                backgroundColor: "info.main",
                                textTransform: "uppercase",
                                borderRadius: 1,
                                transition: "transform .15s",
                                px: 1,
                                mb: 0.5,
                            }}
                        >
                            {extension}
                        </Typography>

                        {filenameCaption}

                        <Box
                            className="controls"
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                transition: "transform .15s",
                                position: "absolute",
                                transform: "translateY(32px)",
                                bottom: 12,
                                left: 12,
                                zIndex: 1,
                            }}
                        >
                            {controls}
                        </Box>
                    </Box>
                )}

                {/* overlay */}
                <Box
                    className={isImage ? "overlay" : undefined}
                    sx={{
                        height: "100%",
                        display: "none",
                        position: "absolute",
                        inset: 0,
                        flexDirection: "column",
                        justifyContent: "space-between",
                        p: 1.5,
                        backgroundColor: "background.default",
                        opacity: 0.9,
                    }}
                >
                    {filenameCaption}

                    <Box display="flex" gap={0.5}>
                        {controls}
                    </Box>
                </Box>
            </Box>
        </Tooltip>
    );
};

interface IFileAttachmentCardProps {
    file: File;
    onDelete: () => void;
}

const FileAttachmentCard: FC<IFileAttachmentCardProps> = ({
    file,
    onDelete,
}) => {
    const [fileUrl, setFileUrl] = useState<string>("");

    useEffect(() => {
        setFileUrl(URL.createObjectURL(file));

        return () => {
            URL.revokeObjectURL(fileUrl);
        };
    }, [file]);

    return (
        <AttachmentCard
            filename={file.name}
            isImage={file.type.startsWith("image/")}
            url={fileUrl}
            onDelete={onDelete}
        />
    );
};

interface IIssueAttachmentCardProps {
    attachment: IssueAttachmentT;
    onDelete: () => void;
}

const IssueAttachmentCard: FC<IIssueAttachmentCardProps> = ({
    attachment,
    onDelete,
}) => {
    const user = useAppSelector((state) => state.profile.user);

    const fileUrl = API_URL + apiVersion + "/files/" + attachment.id;

    const handleDownload = () => {
        window.location.assign(fileUrl);
    };

    return (
        <AttachmentCard
            filename={attachment.name}
            isImage={attachment.content_type.startsWith("image/")}
            url={fileUrl}
            onDownload={handleDownload}
            onDelete={onDelete}
            canDelete={user?.id === attachment.author.id}
        />
    );
};

export { FileAttachmentCard, IssueAttachmentCard };
