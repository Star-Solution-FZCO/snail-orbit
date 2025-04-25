import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { useCallback, useRef } from "react";
import { toast, type TypeOptions } from "react-toastify";

type useUploadToastManagerProps = {
    onAbort?: (id: string) => void;
};

export const useUploadToastManager = (props?: useUploadToastManagerProps) => {
    const { onAbort } = props || {};
    const toastMap = useRef<Map<string, string | number | null>>(new Map());

    const handleClose = useCallback(
        (fileName: string) => {
            onAbort?.(fileName);
            const toastItem = toastMap.current.get(fileName);
            if (toastItem) toast.dismiss(toastItem);
            if (toastMap.current.has(fileName))
                toastMap.current.delete(fileName);
        },
        [onAbort],
    );

    const showToast = useCallback(
        (fileName: string) => {
            if (toastMap.current.has(fileName)) return;
            const id = toast(
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        gap={1}
                    >
                        <Typography>{fileName}</Typography>

                        <IconButton
                            sx={{ p: 0 }}
                            onClick={() => handleClose(fileName)}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <LinearProgress />
                </Box>,
                {
                    closeOnClick: false,
                    closeButton: false,
                    hideProgressBar: true,
                },
            );

            toastMap.current.set(fileName, id);
        },
        [handleClose],
    );

    const updateToast = useCallback(
        (
            fileName: string,
            message: string,
            type: TypeOptions,
            autoClose: number,
        ) => {
            const toastItem = toastMap.current.get(fileName);
            if (toastItem) {
                toast.update(toastItem, {
                    render: <Typography>{message}</Typography>,
                    onClose: () => handleClose(fileName),
                    isLoading: false,
                    autoClose,
                    type,
                });
            }
        },
        [handleClose],
    );

    return { showToast, updateToast };
};
