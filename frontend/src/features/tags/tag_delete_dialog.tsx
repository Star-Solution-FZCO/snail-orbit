import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { TagT } from "shared/model/types";

type TagDeleteDialogProps = {
    tag: TagT;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
};

export const TagDeleteDialog: FC<TagDeleteDialogProps> = ({
    tag,
    open,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("tags.delete.title", {
                    tagName: tag.name,
                })}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("tags.delete.warning")}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={onConfirm}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
