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
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface IConfirmChangesDialogProps {
    open: boolean;
    onSubmit: () => void;
    onClose: () => void;
    loading?: boolean;
}

const DeleteCustomFieldDialog: FC<IConfirmChangesDialogProps> = ({
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

                <LoadingButton
                    onClick={onSubmit}
                    variant="outlined"
                    loading={loading}
                >
                    {t("delete")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export { DeleteCustomFieldDialog };
