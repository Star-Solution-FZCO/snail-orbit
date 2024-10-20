import { Stack } from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AgileBoardFormData } from "../agile_board_form.schema";
import { ColumnFieldSelect } from "../components/column_field_select";
import { ColumnsForm } from "../components/columns_form";

export const ColumnSwimLines: FC = () => {
    const { control } = useFormContext<AgileBoardFormData>();

    const projects = useWatch({ control, name: "projects" });

    return (
        <Stack direction="column" gap={2}>
            <Controller
                control={control}
                name="column_field"
                render={({ field, formState: { errors } }) => (
                    <ColumnFieldSelect
                        {...field}
                        error={errors.column_field}
                        projectId={projects.map((project) => project.id)}
                    />
                )}
            />

            <ColumnsForm />
        </Stack>
    );
};
