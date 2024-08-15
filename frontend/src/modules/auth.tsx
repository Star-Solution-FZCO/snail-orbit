import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Checkbox,
    Container,
    FormControlLabel,
    TextField,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { FC, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { authenticate } from "services/auth";
import { setUser, useAppDispatch, userApi } from "store";

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
            toast.error(error.error_messages?.join(", ") || t("error.default"));
        } finally {
            setLoading(false);
        }
    };

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
                            required
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
                            required
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
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export { Auth };
