import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField, Typography } from "@mui/material";
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
            mt={2}
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
        >
            <Typography fontSize={20} fontWeight="bold">
                {t("projects.create.generalInfo")}
            </Typography>

            <TextField
                {...register("name")}
                label={t("projects.create.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                fullWidth
            />

            <TextField
                {...register("slug")}
                label={t("projects.create.slug")}
                error={!!errors.name}
                helperText={t(errors.slug?.message || "")}
                variant="outlined"
                fullWidth
            />

            <Box>
                <Typography mb={1}>
                    {t("projects.create.description")}
                </Typography>
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor value={value} onChange={onChange} />
                    )}
                />
            </Box>

            <Box display="flex" gap={1}>
                <LoadingButton
                    type="submit"
                    variant="outlined"
                    loading={loading}
                >
                    {t("projects.form.save")}
                </LoadingButton>

                {!hideCancel && (
                    <Link to="..">
                        <Button variant="outlined" color="error">
                            {t("projects.create.cancel")}
                        </Button>
                    </Link>
                )}
            </Box>
        </Box>
    );
};

export { ProjectForm };
