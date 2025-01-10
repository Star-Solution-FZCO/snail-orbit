import { LoadingButton } from "@mui/lab";
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { getRouteApi, Navigate, useNavigate } from "@tanstack/react-router";
import { FC, useState } from "react";
import {
    Controller,
    FormProvider,
    SubmitHandler,
    useForm,
    useFormContext,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { authenticate } from "services/auth";
import { setUser, useAppDispatch, useAppSelector, userApi } from "store";
import { toastApiError } from "utils";

type AuthFormDataT = {
    login: string;
    password: string;
    remember: boolean;
    mfa_totp_code: string | null;
};

const routeApi = getRouteApi("/login");

const TOTPAuth = () => {
    const { t } = useTranslation();

    const {
        register,
        formState: { errors },
    } = useFormContext<AuthFormDataT>();

    return (
        <Stack border={1} p={2} borderRadius={1} borderColor="divider">
            <Stack spacing={1}>
                <Typography fontSize={20} fontWeight="bold" align="center">
                    {t("tfa.auth.totp")}
                </Typography>

                <Typography>{t("tfa.auth.description")}</Typography>
            </Stack>

            <TextField
                {...register("mfa_totp_code")}
                placeholder={t("tfa.enterCode")}
                error={!!errors.mfa_totp_code}
                helperText={t(errors.mfa_totp_code?.message || "")}
                margin="normal"
                fullWidth
            />
        </Stack>
    );
};

const Auth: FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const search = routeApi.useSearch();

    const user = useAppSelector((state) => state.profile.user);

    const [loading, setLoading] = useState(false);
    const [TOTPAuthStep, setTOTPAuthStep] = useState(false);

    const [getProfile, { isLoading: profileLoading }] =
        userApi.useLazyGetProfileQuery();

    const methods = useForm<AuthFormDataT>({
        defaultValues: {
            login: "",
            password: "",
            remember: false,
            mfa_totp_code: null,
        },
    });

    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = methods;

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
            if (error?.mfa_required) {
                setTOTPAuthStep(true);
                return;
            }
            toastApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClickSignInOIDC = () => {
        let path = "/api/auth/oidc";
        if (search.redirect) {
            path += `?redirect=${search.redirect}`;
        }
        window.location.href = path;
    };

    if (user) return <Navigate to={search.redirect || "/"} />;

    return (
        <Box height="100vh">
            <Container maxWidth="xs" sx={{ pt: 8 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar
                        sx={{ mb: 2, bgcolor: "#F07167" }}
                        src="/favicon.ico"
                    />

                    <Typography variant="h5">{t("auth.signIn")}</Typography>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Box display={TOTPAuthStep ? "none" : "block"}>
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
                        </Box>

                        <FormProvider {...methods}>
                            <Box
                                display={TOTPAuthStep ? "block" : "none"}
                                mt={2}
                            >
                                <TOTPAuth />
                            </Box>
                        </FormProvider>

                        <LoadingButton
                            sx={{ mt: 2 }}
                            type="submit"
                            variant="contained"
                            loading={loading || profileLoading}
                            fullWidth
                        >
                            {t("auth.signIn")}
                        </LoadingButton>

                        {!TOTPAuthStep && (
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
                        )}

                        {TOTPAuthStep && (
                            <Button
                                sx={{
                                    mt: 2,
                                }}
                                onClick={() => {
                                    setTOTPAuthStep(false);
                                    setValue("mfa_totp_code", null);
                                }}
                                color="secondary"
                                variant="contained"
                                fullWidth
                            >
                                {t("back")}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export { Auth };
