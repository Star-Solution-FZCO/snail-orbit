import { Box, Button, Stack, TextField } from "@mui/material";
import { ProjectSelect } from "entities/projects/project_select";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MDEditor } from "shared/ui";
import { AxisSelect } from "./axis_select";
import type { ReportFormProps, ReportFormValues } from "./report_form.types";

const defaultValues: ReportFormValues = {
    query: "",
    name: "",
    axis_1: { type: "project", custom_field: null },
    axis_2: null,
    description: "",
    projects: [],
};

export const ReportForm = (props: ReportFormProps) => {
    const { onSubmit, onBack } = props;
    const { t } = useTranslation();

    const form = useForm<ReportFormValues>({
        defaultValues,
    });

    const { handleSubmit, control } = form;

    return (
        <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2}
            onSubmit={handleSubmit(onSubmit)}
        >
            <Controller
                control={control}
                name={"name"}
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("createReport.form.name")}
                        error={invalid}
                        helperText={error?.message || ""}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />

            <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                    <MDEditor
                        value={value || ""}
                        onChange={onChange}
                        placeholder={t("createReport.form.description")}
                    />
                )}
            />

            <Controller
                control={control}
                name="projects"
                render={({ field, fieldState: { error: fieldError } }) => (
                    <ProjectSelect {...field} error={fieldError} />
                )}
            />

            <Controller
                control={control}
                name="query"
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("createReport.form.query")}
                        error={invalid}
                        helperText={error?.message || ""}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />

            <Controller
                control={control}
                name="axis_1"
                render={({ field }) => (
                    <AxisSelect {...field} label={t("axis1.label")} />
                )}
            />

            <Controller
                control={control}
                name="axis_2"
                render={({ field }) => (
                    <AxisSelect
                        {...field}
                        value={field.value || undefined}
                        label={t("axis2.label")}
                        withNone
                    />
                )}
            />

            <Stack direction="row" gap={1}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmit(onSubmit)}
                >
                    {t("save")}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={onBack}
                >
                    {t("cancel")}
                </Button>
            </Stack>
        </Box>
    );
};
