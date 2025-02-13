import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Avatar, Box, Container, TextField, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { passwordReset } from "services/password_reset";
import { toastApiError } from "utils";
import * as yup from "yup";

const passwordResetSchema = yup.object().shape({
    reset_token: yup.string().required("form.validation.required"),
    password: yup.string().required("form.validation.required"),
});

type PasswordResetFormData = yup.InferType<typeof passwordResetSchema>;

const routeApi = getRouteApi("/password-reset");

const PasswordReset = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const search = routeApi.useSearch();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({
        defaultValues: {
            reset_token: search.reset_token || "",
            password: "",
        },
        resolver: yupResolver(passwordResetSchema),
    });

    const reset_token = watch("reset_token");
    const password = watch("password");

    const onSubmit = (formData: PasswordResetFormData) => {
        setLoading(true);

        passwordReset(formData)
            .then(() => {
                toast.success(t("passwordReset.success"));
                navigate({ to: "/" });
            })
            .catch((error: any) => {
                toastApiError(error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Box height="100vh">
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                        sx={{ mb: 2, bgcolor: "#F07167" }}
                        src="/favicon.ico"
                    />

                    <Typography variant="h5">
                        {t("passwordReset.title")}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register("reset_token", {
                                required: "form.validation.required",
                            })}
                            label={t("passwordReset.form.resetToken")}
                            margin="normal"
                            variant="outlined"
                            error={!!errors.reset_token}
                            helperText={t(errors.reset_token?.message || "")}
                            fullWidth
                        />

                        <TextField
                            {...register("password", {
                                required: "form.validation.required",
                            })}
                            label={t("passwordReset.form.password")}
                            type="password"
                            variant="outlined"
                            margin="normal"
                            error={!!errors.password}
                            helperText={t(errors.password?.message || "")}
                            autoFocus
                            fullWidth
                        />

                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            size="small"
                            disabled={!reset_token || !password}
                            loading={loading}
                            fullWidth
                        >
                            {t("passwordReset.form.submit")}
                        </LoadingButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export { PasswordReset };
