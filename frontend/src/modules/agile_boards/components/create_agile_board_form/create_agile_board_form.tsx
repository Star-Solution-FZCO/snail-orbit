import { Box, Button, Stack, TextField } from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC } from "react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, MDEditor } from "shared/ui";
import { ColumnSelectPopover } from "../agile_board_form/components/columns_select_popover";
import { ProjectSelect } from "../agile_board_form/components/project_select";
import type { FormValues } from "./create_agile_board_form.types";

export type CreateAgileBoardFormProps = {
    onSubmit: (formData: FormValues) => void;
};

const defaultValues: FormValues = {
    name: "",
    columns: undefined,
    description: "",
    projects: [],
};

export const CreateAgileBoardForm: FC<CreateAgileBoardFormProps> = ({
    onSubmit,
}) => {
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
                        label={t("agileBoards.form.name")}
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
                        placeholder={t("agileBoards.form.description")}
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
                name="columns.field"
                render={({ field: { onChange, value } }) => (
                    <span>
                        {t("Columns described by")}:{" "}
                        <Button
                            {...bindTrigger(columnSelectPopoverState)}
                            variant="text"
                            size="small"
                        >
                            {value?.name || "-"}
                        </Button>
                        <ColumnSelectPopover
                            {...bindPopover(columnSelectPopoverState)}
                            projectId={projectIds}
                            onChange={(_, value) => onChange(value)}
                        />
                    </span>
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
                <Link to="..">
                    <Button variant="outlined" size="small" color="error">
                        {t("cancel")}
                    </Button>
                </Link>
            </Stack>
        </Box>
    );
};
