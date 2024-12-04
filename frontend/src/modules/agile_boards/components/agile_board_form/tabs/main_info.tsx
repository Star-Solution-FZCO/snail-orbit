import { Stack, TextField } from "@mui/material";
import { MDEditor } from "components";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AgileBoardFormData } from "../agile_board_form.schema";
import { ProjectSelect } from "../components/project_select";

export const MainInfo: FC = () => {
    const { t } = useTranslation();

    const { control } = useFormContext<AgileBoardFormData>();

    return (
        <Stack direction="column" gap={2}>
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
                name="query"
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("agileBoards.form.query")}
                        error={invalid}
                        helperText={error?.message || ""}
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />
        </Stack>
    );
};
