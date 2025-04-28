import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import { Box, IconButton, Modal, Tooltip, Typography } from "@mui/material";
import type { FC } from "react";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { IssueT } from "shared/model/types";
import {
    clearFiles,
    closeFilePreview,
    issueApi,
    selectFilePreviewByIndex,
    setFiles,
    setNextFilePreview,
    setPreviousFilePreview,
    useAppDispatch,
    useAppSelector,
} from "shared/model";
import { formatBytes } from "shared/utils";

interface IFilePreviewProps {
    issue: IssueT;
    isDraft?: boolean;
}

const FilePreview: FC<IFilePreviewProps> = ({ issue, isDraft }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const {
        open,
        currentFile: file,
        files,
        currentIndex,
    } = useAppSelector((state) => state.shared.filePreview);

    const { data: commentsData } = issueApi.useListIssueCommentsQuery(
        {
            id: issue.id_readable,
        },
        {
            skip: isDraft,
        },
    );

    const handleClose = () => {
        dispatch(closeFilePreview());
    };

    const handleDownload = () => {
        window.location.assign(file.src);
    };

    const handleCopyLink = () => {
        const fileUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ""}${file.src}`;

        navigator.clipboard
            .writeText(fileUrl)
            .then(() => {
                toast.success(t("copyLink.success"));
            })
            .catch((err) => {
                console.error("Failed to copy the link: ", err);
                toast.error(t("copyLink.error"));
            });
    };

    const handleClickNextFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        dispatch(setNextFilePreview());
    };

    const handleClickPreviousFile = (
        e: React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.stopPropagation();
        dispatch(setPreviousFilePreview());
    };

    const handleClickThumbnail = (index: number) => {
        dispatch(selectFilePreviewByIndex(index));
    };

    useEffect(() => {
        const commentsAttachments = commentsData
            ? commentsData.payload.items
                  .flatMap((comment) => comment.attachments)
                  .reverse()
            : [];
        dispatch(setFiles([...issue.attachments, ...commentsAttachments]));

        return () => {
            dispatch(clearFiles());
        };
    }, [issue.attachments, commentsData?.payload]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                dispatch(setPreviousFilePreview());
            } else if (e.key === "ArrowRight") {
                dispatch(setNextFilePreview());
            } else if (e.key === "Escape") {
                dispatch(closeFilePreview());
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, dispatch]);

    const showNavigationControls = files.length > 1;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                    },
                },
            }}
        >
            <Box
                display="flex"
                flexDirection="column"
                position="fixed"
                sx={{
                    outline: "none",
                    inset: 0,
                }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    minHeight="64px"
                    px={4}
                    onClick={handleClose}
                >
                    <Typography onClick={(e) => e.stopPropagation()}>
                        {file.name}{" "}
                        <Typography component="span" color="text.secondary">
                            {formatBytes(file.size)}
                        </Typography>
                    </Typography>

                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box
                    width={1}
                    height={1}
                    display="flex"
                    justifyContent={
                        showNavigationControls ? "space-between" : "center"
                    }
                    alignItems="center"
                    px={4}
                    onClick={handleClose}
                >
                    {showNavigationControls && (
                        <IconButton onClick={handleClickPreviousFile}>
                            <ArrowBackIosNewIcon />
                        </IconButton>
                    )}

                    <Box
                        component="img"
                        src={file.src}
                        sx={{
                            display: "block",
                            maxWidth: "80%",
                            maxHeight: "calc(100vh - 128px)",
                            objectFit: "contain",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {showNavigationControls && (
                        <IconButton onClick={handleClickNextFile}>
                            <ArrowForwardIosIcon />
                        </IconButton>
                    )}
                </Box>

                <Box
                    display="flex"
                    alignItems="center"
                    px={4}
                    gap={3}
                    minHeight="64px"
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexBasis="30%"
                    >
                        <Tooltip title={t("download")}>
                            <IconButton onClick={handleDownload}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={t("copyLink")}>
                            <IconButton onClick={handleCopyLink}>
                                <LinkIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box
                        px={4}
                        flex={1}
                        display="flex"
                        gap={1}
                        justifyContent="center"
                        alignItems="center"
                        overflow="auto"
                    >
                        {files.map((file, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 64,
                                    height: 40,
                                    borderRadius: 1,
                                    cursor: "pointer",
                                    borderWidth: 4,
                                    borderColor:
                                        currentIndex === index
                                            ? "info.dark"
                                            : "transparent",
                                    borderStyle: "solid",
                                    boxSizing: "border-box",
                                }}
                                onClick={() => handleClickThumbnail(index)}
                            >
                                <Box
                                    component="img"
                                    src={file.src}
                                    width="100%"
                                    height="100%"
                                    sx={{
                                        objectFit: "cover",
                                        objectPosition: "center",
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>

                    <Box flexBasis="30%" />
                </Box>
            </Box>
        </Modal>
    );
};

export { FilePreview };
