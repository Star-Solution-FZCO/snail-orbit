import { Divider, Stack } from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AgileBoardFormData } from "../agile_board_form.schema";
import { ColumnFieldSelect } from "../components/column_field_select";
import { ColumnsForm } from "../components/columns_form";
import { SwimlaneFieldSelect } from "../components/swim_line_field_select";
import { SwimlanesForm } from "../components/swimlanes_form";

export const ColumnSwimlanes: FC = () => {
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

            <Divider />

            <Controller
                control={control}
                name="swimlane_field"
                render={({ field, formState: { errors } }) => (
                    <SwimlaneFieldSelect
                        {...field}
                        error={errors.swimlane_field}
                        projectId={projects.map((project) => project.id)}
                    />
                )}
            />

            <SwimlanesForm />
        </Stack>
    );
};
