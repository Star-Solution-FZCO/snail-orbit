import { Divider, Stack } from "@mui/material";
import type { FC } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { AgileBoardT } from "shared/model/types";
import { ColumnsForm } from "../components/columns_form";
import { SwimlaneFieldSelect } from "../components/swim_line_field_select";
import { SwimlanesForm } from "../components/swimlanes_form";

export const ColumnSwimlanes: FC = () => {
    const { control } = useFormContext<AgileBoardT>();

    const projects = useWatch({ control, name: "projects" });

    return (
        <Stack direction="column" gap={2}>
            <ColumnsForm />

            <Divider />

            <Controller
                control={control}
                name="swimlanes.field"
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => (
                    <SwimlaneFieldSelect
                        onChange={onChange}
                        value={value}
                        error={error}
                        projectId={projects.map((project) => project.id)}
                    />
                )}
            />

            <SwimlanesForm />
        </Stack>
    );
};
