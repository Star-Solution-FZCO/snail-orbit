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

interface IDeleteCustomFieldOptionDialogProps {
    open: boolean;
    onDelete: () => void;
    onClose: () => void;
    loading?: boolean;
}

const DeleteCustomFieldOptionDialog: FC<
    IDeleteCustomFieldOptionDialogProps
> = ({ open, onDelete, onClose, loading }) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("customFields.options.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("customFields.options.delete.confirmation")}
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

                <Button onClick={onDelete} variant="outlined" loading={loading}>
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteCustomFieldOptionDialog };
