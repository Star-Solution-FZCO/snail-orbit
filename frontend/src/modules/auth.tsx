import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    TextField,
    Typography,
} from "@mui/material";
import { getRouteApi, Navigate, useNavigate } from "@tanstack/react-router";
import { FC, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { authenticate } from "services/auth";
import { setUser, useAppDispatch, useAppSelector, userApi } from "store";
import { toastApiError } from "utils";

type AuthFormDataT = {
    login: string;
    password: string;
    remember: boolean;
};

const routeApi = getRouteApi("/login");

const Auth: FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const search = routeApi.useSearch();

    const { user } = useAppSelector((state) => state.profile);

    const [loading, setLoading] = useState(false);

    const [getProfile, { isLoading: profileLoading }] =
        userApi.useLazyGetProfileQuery();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthFormDataT>({
        defaultValues: {
            login: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit: SubmitHandler<AuthFormDataT> = async (data) => {
        setLoading(true);
        try {
            await authenticate(data);
            const profileResponse = await getProfile().unwrap();
            dispatch(setUser(profileResponse.payload));
            navigate({
                to: search.redirect || "/",
            });
        } catch (error: any) {
            toastApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClickSignInOIDC = () => {
        window.location.href = "/api/auth/oidc";
    };

    if (user) return <Navigate to="/" />;

    return (
        <Box
            height="100vh"
            bgcolor={(theme) => theme.palette.background.content}
        >
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar sx={{ mb: 2, bgcolor: "#F07167" }}>PM</Avatar>

                    <Typography variant="h5">{t("auth.signIn")}</Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register("login", {
                                required: "form.validation.required",
                            })}
                            label={t("auth.form.login")}
                            autoComplete="login"
                            margin="normal"
                            variant="standard"
                            error={!!errors.login}
                            helperText={t(errors.login?.message || "")}
                            autoFocus
                            fullWidth
                        />

                        <TextField
                            {...register("password", {
                                required: "form.validation.required",
                            })}
                            label={t("auth.form.password")}
                            type="password"
                            autoComplete="current-password"
                            variant="standard"
                            margin="normal"
                            error={!!errors.password}
                            helperText={t(errors.password?.message || "")}
                            fullWidth
                        />

                        <Controller
                            name="remember"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <FormControlLabel
                                    label={t("auth.form.remember")}
                                    control={
                                        <Checkbox
                                            checked={value}
                                            onChange={(_, checked) =>
                                                onChange(checked)
                                            }
                                        />
                                    }
                                />
                            )}
                        />

                        <LoadingButton
                            sx={{ mt: 2 }}
                            type="submit"
                            variant="contained"
                            loading={loading || profileLoading}
                            fullWidth
                        >
                            {t("auth.signIn")}
                        </LoadingButton>

                        <Button
                            sx={{
                                bgcolor: "#4444BB",
                                "&:hover": {
                                    bgcolor: "#5C5CFF",
                                },
                                color: "white",
                                mt: 2,
                            }}
                            onClick={handleClickSignInOIDC}
                            variant="contained"
                            fullWidth
                        >
                            {t("auth.signInWithWB")}
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export { Auth };
