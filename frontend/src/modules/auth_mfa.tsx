import { LoadingButton } from "@mui/lab";
import { Avatar, Box, Container, TextField, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { FC, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { mfaAuthenticate } from "services/auth";
import { setUser, useAppDispatch, userApi } from "store";
import { toastApiError } from "utils";

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
            console.log(error);
            toastApiError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box height="100vh">
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar sx={{ mb: 2, bgcolor: "#F07167" }}>PM</Avatar>

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

                        <LoadingButton
                            sx={{ mt: 2 }}
                            type="submit"
                            variant="contained"
                            loading={loading || profileLoading}
                            fullWidth
                        >
                            {t("submit")}
                        </LoadingButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};
