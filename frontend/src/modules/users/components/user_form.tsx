import { yupResolver } from "@hookform/resolvers/yup";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { UserT } from "shared/model/types";
import * as yup from "yup";

const userSchema = yup.object().shape({
    email: yup
        .string()
        .email("form.validation.email")
        .required("form.validation.required"),
    name: yup.string().required("form.validation.required"),
    is_active: yup.boolean().required("form.validation.required"),
    is_admin: yup.boolean().required("form.validation.required"),
    is_bot: yup.boolean().required("form.validation.required"),
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
            is_bot: false,
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
                        sx={{ m: 0 }}
                        control={
                            <Checkbox
                                sx={{ p: 0, pr: 1, borderRadius: 1 }}
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
                                size="small"
                                disableRipple
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
                        sx={{ m: 0 }}
                        control={
                            <Checkbox
                                sx={{ p: 0, pr: 1, borderRadius: 1 }}
                                checked={value}
                                onChange={(e) => onChange(e.target.checked)}
                                size="small"
                                disableRipple
                            />
                        }
                        label={t("users.form.admin")}
                    />
                )}
            />

            <Controller
                name="is_bot"
                control={control}
                render={({ field: { value } }) => (
                    <FormControlLabel
                        sx={{ m: 0 }}
                        control={
                            <Checkbox
                                sx={{ p: 0, pr: 1, borderRadius: 1 }}
                                checked={value}
                                size="small"
                                disableRipple
                                readOnly
                            />
                        }
                        label={t("users.form.bot")}
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
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    disabled={!email || !name}
                    loading={loading}
                >
                    {t("save")}
                </Button>

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
