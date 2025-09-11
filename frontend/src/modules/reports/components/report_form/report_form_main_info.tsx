import { Stack, TextField } from "@mui/material";
import { ProjectSelect } from "entities/projects/project_select";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MDEditor } from "shared/ui";
import { AxisSelect } from "./axis_select";
import type { ReportFormValues } from "./report_form.types";

export const ReportFormMainInfo = () => {
    const { t } = useTranslation();

    const form = useFormContext<ReportFormValues>();

    const { control } = form;

    return (
        <Stack direction="column" gap={2}>
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
        </Stack>
    );
};
