import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import {
    Box,
    IconButton,
    Modal,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { formatBytes } from "shared/utils";
import { useLightbox } from "./context";

export const LightboxModal = () => {
    const { t } = useTranslation();

    const {
        isOpen,
        files,
        currentFile: file,
        index: currentIndex,
        close,
        next,
        prev,
        select,
    } = useLightbox();

    const thumbnailsContainerRef = useRef<HTMLDivElement>(null);
    const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleClose = () => {
        close();
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
        next();
    };

    const handleClickPreviousFile = (
        e: React.MouseEvent<HTMLButtonElement>,
    ) => {
        e.stopPropagation();
        prev();
    };

    const handleClickThumbnail = (index: number) => {
        select(index);
    };

    const scrollToActiveThumbnail = () => {
        const container = thumbnailsContainerRef.current;
        const activeThumbnail = thumbnailRefs.current[currentIndex];

        if (!container || !activeThumbnail) return;

        const containerRect = container.getBoundingClientRect();
        const thumbnailRect = activeThumbnail.getBoundingClientRect();

        const thumbnailLeft =
            thumbnailRect.left - containerRect.left + container.scrollLeft;
        const thumbnailRight = thumbnailLeft + thumbnailRect.width;

        const containerWidth = container.clientWidth;
        const scrollLeft = container.scrollLeft;
        const scrollRight = scrollLeft + containerWidth;

        let newScrollLeft = scrollLeft;

        if (thumbnailLeft < scrollLeft) {
            newScrollLeft = thumbnailLeft - 20;
        } else if (thumbnailRight > scrollRight) {
            newScrollLeft = thumbnailRight - containerWidth + 20;
        }

        container.scrollTo({
            left: Math.max(0, newScrollLeft),
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (isOpen && files.length > 1) {
            const timeoutId = setTimeout(scrollToActiveThumbnail, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [currentIndex, isOpen, files.length]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                prev();
            } else if (e.key === "ArrowRight") {
                next();
            } else if (e.key === "Escape") {
                close();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, prev, next, close]);

    useEffect(() => {
        thumbnailRefs.current = thumbnailRefs.current.slice(0, files.length);
    }, [files.length]);

    const showNavigationControls = files.length > 1;

    return (
        <Modal
            open={isOpen}
            onClose={handleClose}
            slotProps={{
                backdrop: {
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                    },
                },
            }}
        >
            <Stack
                position="fixed"
                sx={{
                    outline: "none",
                    inset: 0,
                }}
            >
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    minHeight="64px"
                    px={4}
                    onClick={handleClose}
                >
                    <Typography onClick={(e) => e.stopPropagation()}>
                        {file.name}{" "}
                        <Typography component="span" color="text.secondary">
                            {formatBytes(file.size || 0)}
                        </Typography>
                    </Typography>

                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Stack>

                <Stack
                    width={1}
                    flex={1}
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    px={4}
                    pb={3}
                    onClick={handleClose}
                    position="relative"
                >
                    {showNavigationControls && (
                        <IconButton
                            sx={{
                                position: "absolute",
                                left: 24,
                                zIndex: 10,
                            }}
                            onClick={handleClickPreviousFile}
                        >
                            <ArrowBackIosNewIcon />
                        </IconButton>
                    )}

                    <Box
                        component="img"
                        src={file.src}
                        sx={{
                            display: "block",
                            maxWidth: "90%",
                            maxHeight: "calc(100vh - 200px)",
                            objectFit: "contain",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {showNavigationControls && (
                        <IconButton
                            onClick={handleClickNextFile}
                            sx={{
                                position: "absolute",
                                right: 24,
                                zIndex: 10,
                            }}
                        >
                            <ArrowForwardIosIcon />
                        </IconButton>
                    )}
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    px={4}
                    gap={3}
                    minHeight="64px"
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        flexBasis="25%"
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
                    </Stack>

                    <Stack
                        direction="row"
                        alignItems="center"
                        flex={1}
                        gap={1}
                        px={4}
                        justifyContent="center"
                        overflow="hidden"
                    >
                        {showNavigationControls && (
                            <IconButton
                                onClick={handleClickPreviousFile}
                                size="small"
                            >
                                <ArrowBackIosNewIcon />
                            </IconButton>
                        )}

                        <Stack
                            ref={thumbnailsContainerRef}
                            maxWidth="600px"
                            direction="row"
                            justifyContent={
                                files.length * 72 <= 600
                                    ? "center"
                                    : "flex-start"
                            }
                            alignItems="center"
                            gap={1}
                            py={1}
                            overflow="auto"
                            sx={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                "&::-webkit-scrollbar": {
                                    display: "none",
                                },
                            }}
                        >
                            {files.map((file, index) => (
                                <Box
                                    key={index}
                                    ref={(el: HTMLDivElement | null) => {
                                        thumbnailRefs.current[index] = el;
                                    }}
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
                                        transition: "all 0.2s ease",
                                        flexShrink: 0,
                                        opacity:
                                            currentIndex === index ? 1 : 0.7,
                                        transform:
                                            currentIndex === index
                                                ? "scale(1.05)"
                                                : "scale(1)",
                                        "&:hover": {
                                            opacity: 1,
                                            transform: "scale(1.05)",
                                        },
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
                                            borderRadius: "inherit",
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>

                        {showNavigationControls && (
                            <IconButton
                                onClick={handleClickNextFile}
                                size="small"
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>
                        )}
                    </Stack>

                    <Box flexBasis="25%" />
                </Stack>
            </Stack>
        </Modal>
    );
};
