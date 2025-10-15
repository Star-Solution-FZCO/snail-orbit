import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, Checkbox, Tooltip, Typography } from "@mui/material";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "shared/model";
import type {
    IssueAttachmentT,
    IssueAttachmentWithSourceT,
} from "shared/model/types";
import { useLightbox } from "shared/ui/lightbox";

type BaseAttachmentCardProps = {
    filename: string;
    isImage: boolean;
    url: string;
    onClick?: () => void;
    onDownload?: () => void;
    onDelete: () => void;
    onSelect?: () => void;
    canDelete?: boolean;
    selectionEnabled?: boolean;
    selected?: boolean;
};

const BaseAttachmentCard: FC<BaseAttachmentCardProps> = ({
    filename,
    isImage,
    url,
    onClick,
    onDownload,
    onDelete,
    onSelect,
    canDelete = true,
    selectionEnabled = false,
    selected = false,
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
    }, [filename, isImage]);

    const controls = useMemo(() => {
        return (
            <>
                {onDownload && (
                    <DownloadIcon
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload();
                        }}
                        fontSize="small"
                    />
                )}
                {canDelete && (
                    <DeleteIcon
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        fontSize="small"
                    />
                )}
            </>
        );
    }, [onDownload, canDelete, onDelete, onSelect, selectionEnabled, selected]);

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
                onClick={onClick}
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
                        opacity: 0.8,
                    }}
                >
                    {filenameCaption}

                    <Box display="flex" gap={0.5}>
                        {controls}
                    </Box>
                </Box>

                {selectionEnabled && (
                    <Checkbox
                        sx={{
                            "&.MuiCheckbox-root": {
                                bgcolor: "background.default",
                                opacity: 0.8,
                            },
                            position: "absolute",
                            right: 12,
                            bottom: 12,
                            p: 0,
                            borderRadius: 1,
                        }}
                        checked={selected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={onSelect}
                        size="small"
                    />
                )}
            </Box>
        </Tooltip>
    );
};

type BrowserFileCardProps = {
    file: File;
    onDelete: () => void;
};

const BrowserFileCard: FC<BrowserFileCardProps> = ({ file, onDelete }) => {
    const [fileUrl, setFileUrl] = useState<string>("");

    const handleClick = () => {
        window.open(fileUrl, "_blank");
    };

    useEffect(() => {
        setFileUrl(URL.createObjectURL(file));

        return () => {
            URL.revokeObjectURL(fileUrl);
        };
    }, [file]);

    return (
        <BaseAttachmentCard
            filename={file.name}
            isImage={file.type.startsWith("image/")}
            url={fileUrl}
            onClick={handleClick}
            onDelete={onDelete}
        />
    );
};

interface IAttachmentCardProps {
    attachment: IssueAttachmentT | IssueAttachmentWithSourceT;
    onDelete: () => void;
    onDownload: (attachment: IssueAttachmentT) => void;
    onSelect: (id: string) => void;
    selectionEnabled: boolean;
    selected: boolean;
}

const AttachmentCard: FC<IAttachmentCardProps> = ({
    attachment,
    onDelete,
    onDownload,
    onSelect,
    selectionEnabled,
    selected,
}) => {
    const user = useAppSelector((state) => state.profile.user);

    const { open } = useLightbox();

    const isImage = attachment.content_type.startsWith("image/");

    const handleClick = () => {
        if (isImage) {
            open({
                id: attachment.id,
                src: attachment.url,
                name: attachment.name,
                size: attachment.size,
                content_type: attachment.content_type,
            });
        } else {
            onDownload(attachment);
        }
    };

    const handleDownload = () => {
        onDownload(attachment);
    };

    const sourceType =
        "source_type" in attachment ? attachment.source_type : "issue";
    const canDelete =
        user?.id === attachment.author.id && sourceType === "issue";

    return (
        <BaseAttachmentCard
            filename={attachment.name}
            isImage={isImage}
            url={attachment.url}
            onClick={handleClick}
            onDownload={handleDownload}
            onDelete={onDelete}
            onSelect={() => onSelect(attachment.id)}
            canDelete={canDelete}
            selectionEnabled={selectionEnabled && canDelete}
            selected={selected}
        />
    );
};

export { AttachmentCard, BrowserFileCard };
