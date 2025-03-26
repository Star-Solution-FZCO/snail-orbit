import { yupResolver } from "@hookform/resolvers/yup";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { WorkflowT } from "types";
import { workflowTypes } from "types";
import * as yup from "yup";

const workflowSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    type: yup
        .string()
        .oneOf(workflowTypes)
        .required("form.validation.required"),
    script: yup.string().required("form.validation.required"),
    schedule: yup.string().nullable().default(null),
});

type WorkflowFormData = yup.InferType<typeof workflowSchema>;

interface IWorkflowFormProps {
    defaultValues?: WorkflowT;
    onSubmit: (formData: WorkflowFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const WorkflowForm: FC<IWorkflowFormProps> = ({
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
            name: "",
            type: "on_change",
            description: null,
            ...defaultValues,
        },
        resolver: yupResolver(workflowSchema),
    });

    const name = watch("name");
    const script = watch("script");
    const type = watch("type");

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
                label={t("workflows.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            <Controller
                name="type"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <FormControl size="small">
                        <InputLabel id="type" error={!!errors.type}>
                            {t("workflows.form.type")}
                        </InputLabel>
                        <Select
                            value={value}
                            labelId="type"
                            label={t("workflows.form.type")}
                            onChange={onChange}
                            error={!!errors.type}
                            disabled={!!defaultValues}
                            size="small"
                        >
                            {workflowTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {t(`workflows.types.${type}`)}
                                </MenuItem>
                            ))}
                        </Select>
                        {!!errors.type && (
                            <FormHelperText error>
                                {t(errors.type?.message || "")}
                            </FormHelperText>
                        )}
                    </FormControl>
                )}
            />

            {type === "scheduled" && (
                <TextField
                    {...register("schedule")}
                    label={t("workflows.form.schedule")}
                    error={!!errors.schedule}
                    helperText={t(errors.schedule?.message || "")}
                    variant="outlined"
                    size="small"
                    fullWidth
                />
            )}

            <TextField
                {...register("description")}
                label={t("description")}
                error={!!errors.description}
                helperText={t(errors.description?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
                multiline
            />

            <TextField
                {...register("script")}
                label={t("workflows.form.script")}
                error={!!errors.script}
                helperText={t(errors.script?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
                multiline
            />

            <Box display="flex" gap={1}>
                <Button
                    type="submit"
                    variant="outlined"
                    size="small"
                    disabled={!script || !name}
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

export { WorkflowForm };
