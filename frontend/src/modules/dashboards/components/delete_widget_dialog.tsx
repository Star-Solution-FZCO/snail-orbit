import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    IconButton,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface DeleteWidgetDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    loading?: boolean;
}

export const DeleteWidgetDialog: FC<DeleteWidgetDialogProps> = ({
    open,
    onClose,
    onDelete,
    loading = false,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("dashboards.widgets.delete.title")}

                <IconButton onClick={onClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogActions>
                <Button onClick={onClose} variant="outlined" disabled={loading}>
                    {t("cancel")}
                </Button>

                <Button
                    onClick={onDelete}
                    variant="outlined"
                    color="error"
                    loading={loading}
                >
                    {t("delete")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
