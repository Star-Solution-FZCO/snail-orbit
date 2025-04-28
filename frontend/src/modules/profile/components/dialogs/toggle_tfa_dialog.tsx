import CloseIcon from "@mui/icons-material/Close";
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
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { userApi } from "shared/model";
import { toastApiError } from "shared/utils";

interface IToggleTFADialogProps {
    open: boolean;
    enabled: boolean;
    onClose: () => void;
}

export const ToggleTFADialog: FC<IToggleTFADialogProps> = ({
    open,
    enabled,
    onClose,
}) => {
    const { t } = useTranslation();

    const [code, setCode] = useState("");

    const [updateMFASettings, { isLoading }] =
        userApi.useUpdateMFASettingsMutation();

    const handleClose = () => {
        setCode("");
        onClose();
    };

    const handleClickConfirm = () => {
        updateMFASettings({
            is_enabled: !enabled,
            mfa_totp_code: code,
        })
            .unwrap()
            .then(() => {
                toast.success(
                    t(enabled ? "tfa.disable.success" : "tfa.enable.success"),
                );
                handleClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight="bold">
                    {t(enabled ? "tfa.disable.title" : "tfa.enable.title")}
                </Typography>

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} alignItems="center">
                    <Typography>
                        {t(
                            enabled
                                ? "tfa.disable.confirmation"
                                : "tfa.enable.confirmation",
                        )}
                    </Typography>

                    <TextField
                        placeholder={t("tfa.enterCode")}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        size="small"
                    />
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
                    disabled={!code}
                    loading={isLoading}
                >
                    {t("tfa.confirm")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
