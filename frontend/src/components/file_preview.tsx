import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import LinkIcon from "@mui/icons-material/Link";
import { Box, IconButton, Modal, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { closeFilePreview, useAppDispatch, useAppSelector } from "store";
import { formatBytes } from "utils";

const FilePreview = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const { open: open, file } = useAppSelector(
        (state) => state.shared.filePreview,
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
                    justifyContent="center"
                    alignItems="center"
                    px={4}
                    onClick={handleClose}
                >
                    {/* <IconButton>
                        <ArrowBackIosNewIcon />
                    </IconButton> */}

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

                    {/* <IconButton>
                        <ArrowForwardIosIcon />
                    </IconButton> */}
                </Box>

                <Box
                    display="flex"
                    alignItems="center"
                    minHeight="64px"
                    px={4}
                    gap={1}
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
            </Box>
        </Modal>
    );
};

export { FilePreview };
