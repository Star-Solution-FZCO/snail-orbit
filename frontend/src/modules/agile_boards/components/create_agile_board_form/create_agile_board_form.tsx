import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Stack, TextField } from "@mui/material";
import { Link, MDEditor } from "components";
import { FC } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSchema } from "utils/hooks/use-schema";
import { ColumnFieldSelect } from "../agile_board_form/components/column_field_select";
import { ProjectSelect } from "../agile_board_form/components/project_select";
import {
    CreateAgileBoardFormData,
    getCreateAgileBoardSchema,
} from "./create_agile_board_form.schema";

export type CreateAgileBoardFormProps = {
    onSubmit: (formData: CreateAgileBoardFormData) => void;
    defaultValues?: CreateAgileBoardFormData;
};

export const CreateAgileBoardForm: FC<CreateAgileBoardFormProps> = ({
    defaultValues,
    onSubmit,
}) => {
    const { t } = useTranslation();
    const createAgileBoardSchema = useSchema(getCreateAgileBoardSchema);

    const form = useForm<CreateAgileBoardFormData>({
        defaultValues: defaultValues,
        resolver: yupResolver(createAgileBoardSchema),
    });

    const { handleSubmit, control } = form;

    const projects = useWatch({ control, name: "projects" });

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
                name="column_field"
                render={({ field, formState: { errors } }) => (
                    <ColumnFieldSelect
                        {...field}
                        error={errors.column_field}
                        projectId={projects?.map((project) => project.id) || []}
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
                <Link to="..">
                    <Button variant="outlined" size="small" color="error">
                        {t("cancel")}
                    </Button>
                </Link>
            </Stack>
        </Box>
    );
};
