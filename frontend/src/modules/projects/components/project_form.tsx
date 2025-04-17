import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import type { TFunction } from "i18next";
import type { FC } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { generateSlug } from "../utils";

const useProjectSchema = (t: TFunction) =>
    yup.object().shape({
        name: yup.string().required(t("form.validation.required")),
        slug: yup.string().required(t("form.validation.required")),
        description: yup.string(),
    });

type ProjectFormData = yup.InferType<ReturnType<typeof useProjectSchema>>;

interface IProjectFormProps {
    defaultValues?: ProjectFormData;
    onSubmit: (formData: ProjectFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
    readOnly?: boolean;
}

const ProjectForm: FC<IProjectFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    hideCancel,
    readOnly,
}) => {
    const { t } = useTranslation();
    const projectSchema = useProjectSchema(t);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm({
        defaultValues,
        resolver: yupResolver(projectSchema),
    });

    const name = watch("name");
    const slug = watch("slug");

    useEffect(() => {
        if (!defaultValues) {
            const slug = generateSlug(name);
            setValue("slug", slug);
        }
    }, [defaultValues, name, setValue]);

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
                label={t("projects.form.name")}
                slotProps={{
                    input: { readOnly },
                }}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <TextField
                {...register("slug")}
                label={t("projects.form.slug")}
                slotProps={{
                    input: { readOnly },
                    inputLabel: { shrink: !!slug },
                }}
                error={!!errors.slug}
                helperText={t(errors.slug?.message || "")}
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
                            placeholder={t("description")}
                            readOnly={readOnly}
                        />
                    )}
                />
            </Box>

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    loading={loading}
                    disabled={readOnly}
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

export { ProjectForm };
