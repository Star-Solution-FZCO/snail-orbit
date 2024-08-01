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
import { useNavigate } from "@tanstack/react-router";
import { FC } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

type AuthFormDataT = {
    username: string;
    password: string;
    remember: boolean;
};

const Auth: FC = () => {
    const navigate = useNavigate();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AuthFormDataT>({
        defaultValues: {
            username: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit: SubmitHandler<AuthFormDataT> = (data) => {
        console.log(data);
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar sx={{ mb: 2, bgcolor: "#F07167" }}>PM</Avatar>

                <Typography variant="h5">Sign in</Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                        {...register("username", { required: true })}
                        label="Username"
                        autoComplete="username"
                        margin="normal"
                        variant="standard"
                        error={!!errors.username}
                        helperText={errors.username?.message}
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
                        fullWidth
                    >
                        Sign In
                    </LoadingButton>
                </Box>
            </Box>
        </Container>
    );
};

export default Auth;
