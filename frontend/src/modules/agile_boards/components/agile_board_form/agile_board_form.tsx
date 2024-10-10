import { yupResolver } from "@hookform/resolvers/yup";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { CKMDEditor } from "components";
import { FC } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    AgileBoardFormData,
    agileBoardSchema,
} from "./agile_board_form.schema";
import { ColumnFieldSelect } from "./column_field_select";
import { ColumnsForm } from "./columns_form";
import { ProjectSelect } from "./project_select";

interface IAgileBoardFormProps {
    defaultValues?: AgileBoardFormData;
    onSubmit: (formData: AgileBoardFormData) => void;
    loading?: boolean;
    onDelete?: () => void;
}

const AgileBoardForm: FC<IAgileBoardFormProps> = ({
    defaultValues,
    onSubmit,
    loading,
    onDelete,
}) => {
    const { t } = useTranslation();

    const form = useForm<AgileBoardFormData>({
        defaultValues: defaultValues,
        resolver: yupResolver(agileBoardSchema),
    });

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = form;

    return (
        <FormProvider {...form}>
            <Box
                component="form"
                display="flex"
                flexDirection="column"
                gap={2}
                onSubmit={handleSubmit(onSubmit)}
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
                            <CKMDEditor
                                value={value || ""}
                                onChange={onChange}
                                placeholder={t("agileBoards.form.description")}
                            />
                        )}
                    />
                )}

                <Controller
                    control={control}
                    name="projects"
                    render={({ field, fieldState: { error: fieldError } }) => (
                        <ProjectSelect {...field} error={fieldError} />
                    )}
                />

                <Controller
                    control={control}
                    name="column_field"
                    render={({ field, formState: { errors } }) => (
                        <ColumnFieldSelect
                            {...field}
                            error={errors.column_field}
                            projectId={(watch("projects") || []).map(
                                (project) => project.id,
                            )}
                        />
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

                        <ColumnsForm />
                    </>
                )}

                <Box display="flex" gap={1}>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        size="small"
                        loading={loading}
                    >
                        {defaultValues ? t("update") : t("create")}
                    </LoadingButton>

                    {!defaultValues && (
                        <Link to="..">
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                            >
                                {t("cancel")}
                            </Button>
                        </Link>
                    )}

                    {onDelete && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={onDelete}
                        >
                            {t("delete")}
                        </Button>
                    )}
                </Box>
            </Box>
        </FormProvider>
    );
};

export { AgileBoardForm };
