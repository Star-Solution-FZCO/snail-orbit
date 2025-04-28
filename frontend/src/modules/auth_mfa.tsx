import {
    Avatar,
    Box,
    Button,
    Container,
    TextField,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { mfaAuthenticate } from "shared/api/services/auth";
import { setUser, useAppDispatch, userApi } from "shared/model";
import { toastApiError } from "shared/utils";

type MFAFormDataT = {
    code: string;
};

export const MFAView: FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [getProfile, { isLoading: profileLoading }] =
        userApi.useLazyGetProfileQuery();

    const methods = useForm<MFAFormDataT>({
        defaultValues: {
            code: "",
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = methods;

    const onSubmit: SubmitHandler<MFAFormDataT> = async (data) => {
        setLoading(true);
        try {
            await mfaAuthenticate(data.code);
            const profileResponse = await getProfile().unwrap();
            dispatch(setUser(profileResponse.payload));
            navigate({
                to: "/",
            });
        } catch (error: any) {
            toastApiError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box height="100vh">
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                        sx={{ mb: 2, bgcolor: "#F07167" }}
                        src="/favicon.ico"
                    />

                    <Typography variant="h5">{t("auth.mfa")}</Typography>

                    <Typography color="textSecondary" mt={1}>
                        {t("auth.mfa.description")}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register("code", {
                                required: "form.validation.required",
                            })}
                            label={t("tfa.enterCode")}
                            margin="normal"
                            variant="outlined"
                            error={!!errors.code}
                            helperText={t(errors.code?.message || "")}
                            autoFocus
                            fullWidth
                        />

                        <Button
                            sx={{ mt: 2 }}
                            type="submit"
                            variant="contained"
                            loading={loading || profileLoading}
                            fullWidth
                        >
                            {t("submit")}
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};
