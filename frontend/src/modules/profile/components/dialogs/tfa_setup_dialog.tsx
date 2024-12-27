import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { LoadingButton } from "@mui/lab";
import {
    Box,
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
import { QRCodeSVG } from "qrcode.react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { userApi } from "store";
import { TOTPDataT } from "types";
import { toastApiError } from "utils";

interface ITFASetupDialogProps {
    open: boolean;
    data: TOTPDataT | null;
    onClose: () => void;
}

export const TFASetupDialog: FC<ITFASetupDialogProps> = ({
    open,
    data,
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

    const handleClickCopySecret = () => {
        if (!data) return;

        navigator.clipboard.writeText(data.secret).then(() => {
            toast.success(t("clipboard.copied"));
        });
    };

    const handleClickConfirm = () => {
        if (!data) return;
        if (!code) return;

        updateMFASettings({
            is_enabled: false,
            mfa_totp_code: code,
        })
            .unwrap()
            .then(() => {
                toast.success(t("tfa.setup.success"));
                handleClose();
            })
            .catch(toastApiError);
    };

    if (!data) return null;

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                handleClose();
            }}
            fullWidth
        >
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Typography fontWeight="bold">{t("tfa.title")}</Typography>

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} alignItems="center">
                    <Typography>{t("tfa.setup.description")}</Typography>

                    <QRCodeSVG value={data.link} size={200} marginSize={3} />

                    <Stack
                        border={1}
                        borderColor="divider"
                        borderRadius={2}
                        p={1}
                        spacing={1}
                        alignItems="center"
                        bgcolor="info.dark"
                    >
                        <Typography align="center">
                            <Typography component="span" fontWeight="bold">
                                {t("tfa.setup.scanNotWorking")}
                            </Typography>{" "}
                            {t("tfa.setup.copySecret")}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontWeight="bold">
                                {data.secret}
                            </Typography>

                            <IconButton
                                onClick={handleClickCopySecret}
                                size="small"
                            >
                                <ContentCopyIcon />
                            </IconButton>
                        </Box>
                    </Stack>

                    <Typography>{t("tfa.setup.secret")}</Typography>

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

                <LoadingButton
                    onClick={handleClickConfirm}
                    variant="outlined"
                    disabled={!code}
                    loading={isLoading}
                >
                    {t("tfa.confirm")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};
