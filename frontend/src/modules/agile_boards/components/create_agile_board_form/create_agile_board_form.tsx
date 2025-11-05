import ClearIcon from "@mui/icons-material/Clear";
import {
    Box,
    Button,
    FormHelperText,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { ProjectSelect } from "entities/projects/project_select";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC } from "react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, MDEditor } from "shared/ui";
import { ColumnSelectPopover } from "../agile_board_form/components/columns_select_popover";
import type {
    CreateAgileBoardFormProps,
    FormValues,
} from "./create_agile_board_form.types";

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

    const { control, handleSubmit } = form;

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
                name="name"
                rules={{
                    required: t("form.validation.required"),
                }}
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("agileBoards.form.name")}
                        error={invalid}
                        helperText={t(error?.message || "")}
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
                rules={{
                    validate: (value) =>
                        value.length > 0 || t("form.validation.required"),
                }}
                render={({ field, fieldState: { error: fieldError } }) => (
                    <ProjectSelect {...field} error={fieldError} />
                )}
            />

            <Controller
                control={control}
                name="columns.field"
                rules={{
                    required: t("form.validation.required"),
                }}
                render={({
                    field: { value, onChange },
                    fieldState: { error },
                }) => (
                    <Box>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography
                                color={error ? "error.main" : "text.primary"}
                            >
                                {t("columns.describedBy")}:{" "}
                            </Typography>

                            <Button
                                {...bindTrigger(columnSelectPopoverState)}
                                variant="outlined"
                                size="small"
                            >
                                {value?.name || t("columns.selectColumn")}
                            </Button>

                            {value && (
                                <IconButton
                                    onClick={() => onChange(null)}
                                    size="small"
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            )}

                            <ColumnSelectPopover
                                {...bindPopover(columnSelectPopoverState)}
                                projectId={projectIds}
                                onChange={(_, value) => onChange(value)}
                            />
                        </Stack>

                        {error && (
                            <FormHelperText sx={{ mt: 0.5, ml: 1.75 }} error>
                                {error.message}
                            </FormHelperText>
                        )}
                    </Box>
                )}
            />

            <Stack direction="row" gap={1}>
                <Button type="submit" variant="contained" size="small">
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
