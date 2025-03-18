import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
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

interface IDeleteAttachmentDialogProps {
    open: boolean;
    filename: string;
    onClose: () => void;
    onDelete: () => void;
    loading?: boolean;
}

const DeleteAttachmentDialog: FC<IDeleteAttachmentDialogProps> = ({
    open,
    filename,
    onClose,
    onDelete,
    loading,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("issues.attachments.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("issues.attachments.delete.confirmation")} "{filename}"?
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={onDelete}
                    variant="outlined"
                    loading={loading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteAttachmentDialog };
