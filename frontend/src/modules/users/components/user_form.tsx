import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UserT } from "types";
import * as yup from "yup";

const userSchema = yup.object().shape({
    email: yup
        .string()
        .email("form.validation.email")
        .required("form.validation.required"),
    name: yup.string().required("form.validation.required"),
    is_active: yup.boolean().required("form.validation.required"),
    is_admin: yup.boolean().required("form.validation.required"),
    send_email_invite: yup.boolean().required("form.validation.required"),
    send_pararam_invite: yup.boolean().required("form.validation.required"),
});

type UserFormData = yup.InferType<typeof userSchema>;

interface IUserFormProps {
    defaultValues?: UserT;
    onSubmit: (formData: UserFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const UserForm: FC<IUserFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideCancel,
}) => {
    const { t } = useTranslation();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({
        defaultValues: {
            email: "",
            name: "",
            is_active: true,
            is_admin: false,
            send_email_invite: false,
            send_pararam_invite: false,
            ...defaultValues,
        },
        resolver: yupResolver(userSchema),
    });

    const email = watch("email");
    const name = watch("name");

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
            maxWidth="md"
        >
            <TextField
                {...register("email")}
                label={t("users.form.email")}
                error={!!errors.email}
                helperText={t(errors.email?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <TextField
                {...register("name")}
                label={t("users.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Controller
                name="is_active"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={value}
                                size="small"
                                disableRipple
                                onChange={(e) => onChange(e.target.checked)}
                            />
                        }
                        label={t("users.form.active")}
                    />
                )}
            />

            <Controller
                name="is_admin"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={value}
                                size="small"
                                disableRipple
                                onChange={(e) => onChange(e.target.checked)}
                            />
                        }
                        label={t("users.form.admin")}
                    />
                )}
            />

            {!defaultValues && (
                <>
                    <Controller
                        name="send_email_invite"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={value}
                                        size="small"
                                        disableRipple
                                        onChange={(e) =>
                                            onChange(e.target.checked)
                                        }
                                    />
                                }
                                label={t("users.form.sendEmailInvite")}
                            />
                        )}
                    />
                    <Controller
                        name="send_pararam_invite"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={value}
                                        size="small"
                                        disableRipple
                                        onChange={(e) =>
                                            onChange(e.target.checked)
                                        }
                                    />
                                }
                                label={t("users.form.sendPararamInvite")}
                            />
                        )}
                    />
                </>
            )}

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    size="small"
                    disabled={!email || !name}
                    loading={loading}
                >
                    {t("save")}
                </LoadingButton>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error" size="small">
                            {t("cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export { UserForm };
