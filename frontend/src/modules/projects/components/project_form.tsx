import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ProjectT } from "types";
import * as yup from "yup";

const projectSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    slug: yup.string().required("form.validation.required"),
    description: yup.string(),
});

type ProjectFormData = yup.InferType<typeof projectSchema>;

interface IProjectFormProps {
    defaultValues?: ProjectT;
    onSubmit: (formData: ProjectFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const ProjectForm: FC<IProjectFormProps> = ({
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
        resolver: yupResolver(projectSchema),
    });

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
        >
            <TextField
                {...register("name")}
                label={t("projects.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                required
                fullWidth
            />

            <TextField
                {...register("slug")}
                label={t("projects.form.slug")}
                error={!!errors.slug}
                helperText={t(errors.slug?.message || "")}
                variant="outlined"
                size="small"
                required
                fullWidth
            />

            <Box>
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value}
                            onChange={onChange}
                            textareaProps={{
                                placeholder: t("projects.form.description"),
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
                    {t("projects.form.save")}
                </LoadingButton>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error" size="small">
                            {t("projects.form.cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export { ProjectForm };
