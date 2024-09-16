import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import { Box, Button, FormLabel, IconButton, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AgileBoardT, customFieldsTypes, CustomFieldTypeT } from "types";
import * as yup from "yup";
import { ColumnFieldSelect } from "./column_field_select";
import { ProjectSelect } from "./project_select";

const agileBoardSchema = yup.object().shape({
    name: yup.string().required("form.validation.required"),
    description: yup.string().nullable().default(null),
    query: yup.string().nullable().default(null),
    column_field: yup
        .object()
        .shape({
            id: yup.string().required(),
            name: yup.string().required(),
            type: yup
                .mixed<CustomFieldTypeT>()
                .oneOf([...customFieldsTypes])
                .required(),
        })
        .required("form.validation.required"),
    columns: yup.array().of(yup.string().required()).required(),
    projects: yup
        .array()
        .of(yup.string().required())
        .required("form.validation.required"),
    swimlane_field: yup.string().nullable().default(null),
    swimlanes: yup.array().of(yup.string().required()).required(),
});

type AgileBoardFormData = yup.InferType<typeof agileBoardSchema>;

interface IAgileBoardFormProps {
    defaultValues?: AgileBoardT;
    onSubmit: (formData: AgileBoardFormData) => void;
    loading?: boolean;
    hideCancel?: boolean;
}

const formatDefaultValues = (values: AgileBoardT): AgileBoardFormData => ({
    ...values,
    projects: values.projects.map((el) => el.id),
});

const AgileBoardForm: FC<IAgileBoardFormProps> = ({
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
        defaultValues: defaultValues
            ? formatDefaultValues(defaultValues)
            : undefined,
        resolver: yupResolver(agileBoardSchema),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        // @ts-ignore
        name: "columns",
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
                label={t("agileBoards.form.name")}
                error={!!errors.name}
                helperText={t(errors.name?.message || "")}
                variant="outlined"
                size="small"
                fullWidth
            />

            {!!defaultValues && (
                <Controller
                    name="description"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <MDEditor
                            value={value || ""}
                            onChange={onChange}
                            textareaProps={{
                                placeholder: t("agileBoards.form.description"),
                            }}
                        />
                    )}
                />
            )}

            <Controller
                control={control}
                name="projects"
                render={({ field, formState: { errors } }) => (
                    <ProjectSelect {...field} error={errors.projects} />
                )}
            />

            <Controller
                control={control}
                name="column_field"
                render={({ field, formState: { errors } }) => (
                    <ColumnFieldSelect {...field} error={errors.column_field} />
                )}
            />

            {!!defaultValues && (
                <>
                    <TextField
                        {...register("query")}
                        label={t("agileBoards.form.query")}
                        error={!!errors.query}
                        helperText={t(errors.query?.message || "")}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />

                    <Box display="flex" flexDirection="column" gap={1}>
                        <FormLabel>{t("agileBoards.form.columns")}</FormLabel>

                        {fields.map((field, index) => (
                            <Box
                                key={field.id}
                                display="flex"
                                alignItems="center"
                                gap={1}
                            >
                                <TextField
                                    {...register(`columns.${index}` as const)}
                                    label={t(`agileBoards.form.column`)}
                                    error={!!errors.columns?.[index]}
                                    helperText={t(
                                        errors.columns?.[index]?.message || "",
                                    )}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                />
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => remove(index)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}

                        <Button
                            sx={{ alignSelf: "flex-start" }}
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => append("")}
                        >
                            {t("agileBoards.form.addColumn")}
                        </Button>
                    </Box>
                </>
            )}

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

export { AgileBoardForm };
