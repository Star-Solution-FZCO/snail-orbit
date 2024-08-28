import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RoleT } from "types";
import * as yup from "yup";

const roleSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
});

type RoleFormData = yup.InferType<typeof roleSchema>;

interface IGroupFormProps {
    defaultValues?: RoleT;
    onSubmit: (formData: RoleFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const RoleForm: FC<IGroupFormProps> = ({
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
    } = useForm({
        defaultValues,
        resolver: yupResolver(roleSchema),
    });

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
                {...register("name")}
                label={t("roles.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Box>
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value || ""}
                            onChange={onChange}
                            textareaProps={{
                                placeholder: t("description"),
                            }}
                        />
                    )}
                />
            </Box>

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    size="small"
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

export { RoleForm };
