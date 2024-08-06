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
import { nanoid } from "@reduxjs/toolkit";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { FC, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { authenticate } from "services/auth";
import { setUser, useAppDispatch } from "store";

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

    const onSubmit: SubmitHandler<AuthFormDataT> = (data) => {
        setLoading(true);
        authenticate(data)
            .then(() => {
                // temporary
                dispatch(
                    setUser({
                        id: nanoid(),
                        name: "user",
                        email: data.login,
                        is_admin: true,
                    }),
                );
                navigate({
                    to: search.redirect || "/",
                });
            })
            .catch((error) => {
                toast.error(error.detail || t("error.default"));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Box
            height="100vh"
            bgcolor={(theme) => theme.palette.background.content}
        >
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar sx={{ mb: 2, bgcolor: "#F07167" }}>PM</Avatar>

                    <Typography variant="h5">Sign in</Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            {...register("login", { required: true })}
                            label="Login"
                            autoComplete="login"
                            margin="normal"
                            variant="standard"
                            error={!!errors.login}
                            helperText={errors.login?.message}
                            autoFocus
                            fullWidth
                            required
                        />

                        <TextField
                            {...register("password", { required: true })}
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            variant="standard"
                            margin="normal"
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            fullWidth
                            required
                        />

                        <Controller
                            name="remember"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                                <FormControlLabel
                                    label="Remember me"
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
                            loading={loading}
                            fullWidth
                        >
                            Sign In
                        </LoadingButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export { Auth };
