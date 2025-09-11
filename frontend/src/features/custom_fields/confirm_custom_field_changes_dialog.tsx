import CloseIcon from "@mui/icons-material/Close";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface IConfirmCustomFieldChangesDialogProps {
    open: boolean;
    onSubmit: () => void;
    onClose: () => void;
    loading?: boolean;
    customFieldName?: string;
}

export const ConfirmCustomFieldChangesDialog: FC<
    IConfirmCustomFieldChangesDialogProps
> = ({ open, onSubmit, onClose, loading, customFieldName }) => {
    const { t } = useTranslation();
    const [confirmationText, setConfirmationText] = useState("");

    const isConfirmationValid = confirmationText === customFieldName;

    const handleSubmit = () => {
        if (isConfirmationValid) {
            onSubmit();
            setConfirmationText("");
        }
    };

    const handleClose = () => {
        onClose();
        setConfirmationText("");
    };

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
                    {t("customFields.save.warning")}
                </DialogContentText>

                {customFieldName && (
                    <>
                        <Typography mt={2} mb={1} fontWeight="bold">
                            {t("customFields.save.confirmationRequired")}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            mb={2}
                        >
                            {t("customFields.save.typeFieldName", {
                                name: customFieldName,
                            })}
                        </Typography>

                        <TextField
                            value={confirmationText}
                            placeholder={customFieldName}
                            onChange={(e) =>
                                setConfirmationText(e.target.value)
                            }
                            error={
                                confirmationText !== "" && !isConfirmationValid
                            }
                            helperText={
                                confirmationText !== "" && !isConfirmationValid
                                    ? t("customFields.save.nameDoesNotMatch")
                                    : ""
                            }
                            fullWidth
                            size="small"
                        />
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="outlined"
                    loading={loading}
                    disabled={!isConfirmationValid}
                >
                    {t("save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
