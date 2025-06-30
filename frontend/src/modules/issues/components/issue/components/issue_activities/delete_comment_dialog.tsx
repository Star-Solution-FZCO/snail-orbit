import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import { t } from "i18next";
import type { FC } from "react";

type IDeleteCommentDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit?: () => void;
    isLoading?: boolean;
};

export const DeleteCommentDialog: FC<IDeleteCommentDialogProps> = ({
    open,
    onClose,
    onSubmit,
    isLoading,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("issues.comments.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>{t("issues.comments.delete.warning")}</DialogContent>
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
                    onClick={onSubmit}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
