import { Box, Button, Stack, TextField } from "@mui/material";
import { ProjectSelect } from "entities/projects/project_select";
import { usePopupState } from "material-ui-popup-state/hooks";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, MDEditor } from "shared/ui";
import { AxisSelect } from "./axis_select";
import type {
    CreateReportFormProps,
    FormValues,
} from "./create_report_form.types";

const defaultValues: FormValues = {
    name: "",
    axis_1: { type: "project", custom_field: null },
    description: "",
    projects: [],
};

export const CreateReportForm = (props: CreateReportFormProps) => {
    const { onSubmit } = props;
    const { t } = useTranslation();

    const columnSelectPopoverState = usePopupState({
        variant: "popover",
        popupId: "column-select",
    });

    const form = useForm<FormValues>({
        defaultValues,
    });

    const { handleSubmit, control } = form;

    const projects = useWatch({ control, name: "projects" });

    const projectIds = useMemo(
        () => projects.map((project) => project.id),
        [projects],
    );

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
                name="axis_1"
                render={({ field }) => <AxisSelect {...field} />}
            />

            {/*<Controller*/}
            {/*    control={control}*/}
            {/*    name="axis_1.field"*/}
            {/*    render={({ field: { onChange, value } }) => (*/}
            {/*        <span>*/}
            {/*            {t("columns.describedBy")}:{" "}*/}
            {/*            <Button*/}
            {/*                {...bindTrigger(columnSelectPopoverState)}*/}
            {/*                variant="text"*/}
            {/*                size="small"*/}
            {/*            >*/}
            {/*                {value?.name || "-"}*/}
            {/*            </Button>*/}
            {/*            <ColumnSelectPopover*/}
            {/*                {...bindPopover(columnSelectPopoverState)}*/}
            {/*                projectId={projectIds}*/}
            {/*                onChange={(_, value) => onChange(value)}*/}
            {/*            />*/}
            {/*        </span>*/}
            {/*    )}*/}
            {/*/>*/}

            <Stack direction="row" gap={1}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmit(onSubmit)}
                >
                    {t("save")}
                </Button>
                <Link to="..">
                    <Button variant="outlined" size="small" color="error">
                        {t("cancel")}
                    </Button>
                </Link>
            </Stack>
        </Box>
    );
};
