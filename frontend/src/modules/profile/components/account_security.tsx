import KeyIcon from "@mui/icons-material/Key";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Button, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "store";
import type { TOTPDataT } from "types";
import { toastApiError } from "utils";
import { DeleteTOTPDialog } from "./dialogs/delete_totp_dialog";
import { TFASetupDialog } from "./dialogs/tfa_setup_dialog";
import { ToggleTFADialog } from "./dialogs/toggle_tfa_dialog";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const AccountSecurity = () => {
    const { t } = useTranslation();

    const { data: mfaSettings, isLoading } = userApi.useGetMFASettingsQuery();

    const [createOTP, { isLoading: createOTPLoading }] =
        userApi.useCreateOTPMutation();

    const [TOTPData, setTOTPData] = useState<TOTPDataT | null>(null);
    const [toggleTFADialogOpen, setToggleTFADialogOpen] = useState(false);
    const [deleteTOTPDialogOpen, setDeleteTOTPDialogOpen] = useState(false);

    const tfaEnabled = mfaSettings?.payload.is_enabled ?? false;
    const totpCreated = mfaSettings?.payload.totp.created_at ?? null;

    const handleClickSetup = () => {
        createOTP()
            .unwrap()
            .then((response) => {
                setTOTPData(response.payload);
            })
            .catch(toastApiError);
    };

    const handleClickDelete = () => {
        setDeleteTOTPDialogOpen(true);
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

                <Typography>
                    {t("tfa.totp.status")}:{" "}
                    <Typography
                        component="span"
                        color={totpCreated ? "success" : "error"}
                    >
                        {totpCreated
                            ? `${t("tfa.totp.status.set")} ${dayjs
                                  .utc(totpCreated)
                                  .local()
                                  .format("DD MMM YYYY HH:mm")}`
                            : t("tfa.totp.status.notSet")}
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

            <DeleteTOTPDialog
                open={deleteTOTPDialogOpen}
                tfaEnabled={tfaEnabled}
                onClose={() => setDeleteTOTPDialogOpen(false)}
            />

            <Box display="flex" gap={1}>
                <Button
                    onClick={totpCreated ? handleClickDelete : handleClickSetup}
                    variant="outlined"
                    size="small"
                    color={totpCreated ? "error" : "primary"}
                    loading={isLoading || createOTPLoading}
                    startIcon={<KeyIcon />}
                >
                    {t(
                        totpCreated
                            ? "tfa.totp.delete.title"
                            : "tfa.setup.title",
                    )}
                </Button>

                {totpCreated && (
                    <Button
                        onClick={handleToggleTFA}
                        variant="outlined"
                        size="small"
                        color={tfaEnabled ? "error" : "secondary"}
                        startIcon={<LockIcon />}
                    >
                        {tfaEnabled ? t("tfa.disable") : t("tfa.enable")}
                    </Button>
                )}
            </Box>
        </Stack>
    );
};
