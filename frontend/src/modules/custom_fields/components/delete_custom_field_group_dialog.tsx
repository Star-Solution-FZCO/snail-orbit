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

interface IDeleteCustomFieldGroupDialogProps {
    open: boolean;
    onSubmit: () => void;
    onClose: () => void;
    loading?: boolean;
}

const DeleteCustomFieldGroupDialog: FC<IDeleteCustomFieldGroupDialogProps> = ({
    open,
    onSubmit,
    onClose,
    loading,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("common.warning")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("customFields.delete.warning")}
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

                <Button onClick={onSubmit} variant="outlined" loading={loading}>
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteCustomFieldGroupDialog };
