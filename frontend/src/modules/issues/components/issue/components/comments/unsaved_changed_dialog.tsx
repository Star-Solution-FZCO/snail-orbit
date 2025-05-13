import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

type UnsavedChangesDialogProps = {
    open: boolean;
    onClose: () => void;
    onDiscard: () => void;
};

export const UnsavedChangesDialog: FC<UnsavedChangesDialogProps> = ({
    open,
    onClose,
    onDiscard,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {t("issues.comments.unsavedChanges.title")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {t("issues.comments.unsavedChanges.warning")}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" color="error">
                    {t("cancel")}
                </Button>
                <Button onClick={onDiscard} variant="outlined">
                    {t("issues.comments.unsavedChanges.discard")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
