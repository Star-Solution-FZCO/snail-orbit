import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { userApi } from "store";
import { toastApiError } from "utils";

interface IDeleteTOTPDialogProps {
    open: boolean;
    tfaEnabled: boolean;
    onClose: () => void;
}

export const DeleteTOTPDialog: FC<IDeleteTOTPDialogProps> = ({
    open,
    tfaEnabled,
    onClose,
}) => {
    const { t } = useTranslation();

    const [deleteOTP, { isLoading }] = userApi.useDeleteOTPMutation();

    const [code, setCode] = useState<string | null>(null);

    const handleClose = () => {
        setCode(null);
        onClose();
    };

    const handleClickConfirm = () => {
        deleteOTP({ mfa_totp_code: code })
            .unwrap()
            .then(() => {
                toast.success(t("tfa.totp.delete.success"));
                handleClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs">
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight="bold">
                    {t("tfa.totp.delete.title")}
                </Typography>

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} alignItems="center">
                    <Typography>
                        {t(
                            tfaEnabled
                                ? "tfa.totp.delete.confirmationWithCode"
                                : "tfa.totp.delete.confirmation",
                        )}
                    </Typography>

                    {tfaEnabled && (
                        <TextField
                            placeholder={t("tfa.enterCode")}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            size="small"
                        />
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <Button
                    onClick={handleClickConfirm}
                    variant="outlined"
                    disabled={!code && tfaEnabled}
                    loading={isLoading}
                >
                    {t("tfa.confirm")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
