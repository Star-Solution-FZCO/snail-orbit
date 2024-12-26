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

const TFASetupDialog: FC<ITFASetupDialogProps> = ({ open, data, onClose }) => {
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
                <Typography fontWeight="bold">
                    {t("tfa.setup.title")}
                </Typography>

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
                    {t("tfa.setup.confirm")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IToggleTFADialogProps {
    open: boolean;
    enabled: boolean;
    onClose: () => void;
}

const ToggleTFADialog: FC<IToggleTFADialogProps> = ({
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
            mfa_totp_code: !enabled ? code : null,
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

                <LoadingButton
                    onClick={handleClickConfirm}
                    variant="outlined"
                    disabled={!enabled && !code}
                    loading={isLoading}
                >
                    {t("tfa.setup.confirm")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export const AccountSecurity = () => {
    const { t } = useTranslation();

    const { data: mfaSettings, isLoading } = userApi.useGetMFASettingsQuery();

    const [createOTP, { isLoading: createOTPLoading }] =
        userApi.useCreateOTPMutation();

    const [TOTPData, setTOTPData] = useState<TOTPDataT | null>(null);
    const [toggleTFADialogOpen, setToggleTFADialogOpen] = useState(false);

    const tfaEnabled = mfaSettings?.payload.is_enabled ?? false;

    const handleClickSetup = () => {
        createOTP()
            .unwrap()
            .then((response) => {
                setTOTPData(response.payload);
            })
            .catch(toastApiError);
    };

    const handleToggleTFA = () => {
        setToggleTFADialogOpen(true);
    };

    return (
        <Stack spacing={2}>
            <Stack spacing={1}>
                <Typography fontWeight="bold">{t("tfa.title")}</Typography>

                <Typography color="textSecondary">
                    {t("tfa.description")}
                </Typography>

                <Typography>
                    {t("tfa.status")}:{" "}
                    <Typography
                        component="span"
                        color={tfaEnabled ? "success" : "error"}
                    >
                        {t(
                            tfaEnabled
                                ? "tfa.status.enabled"
                                : "tfa.status.disabled",
                        )}
                    </Typography>
                </Typography>
            </Stack>

            <TFASetupDialog
                open={TOTPData !== null}
                data={TOTPData}
                onClose={() => setTOTPData(null)}
            />

            <ToggleTFADialog
                open={toggleTFADialogOpen}
                enabled={tfaEnabled}
                onClose={() => setToggleTFADialogOpen(false)}
            />

            <Box display="flex" gap={1}>
                {!tfaEnabled && (
                    <LoadingButton
                        onClick={handleClickSetup}
                        variant="outlined"
                        size="small"
                        color="secondary"
                        loading={isLoading || createOTPLoading}
                    >
                        {t("tfa.setup")}
                    </LoadingButton>
                )}

                <Button
                    onClick={handleToggleTFA}
                    variant="outlined"
                    size="small"
                    color={tfaEnabled ? "error" : "primary"}
                >
                    {tfaEnabled ? t("tfa.disable") : t("tfa.enable")}
                </Button>
            </Box>
        </Stack>
    );
};
