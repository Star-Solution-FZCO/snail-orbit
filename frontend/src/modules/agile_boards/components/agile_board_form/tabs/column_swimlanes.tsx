import { Stack } from "@mui/material";
import type { FC } from "react";
import { ColumnsForm } from "../components/columns_form";
import { SwimlanesForm } from "../components/swimlanes_form";

export const ColumnSwimlanes: FC = () => {
    return (
        <Stack direction="column" gap={1}>
            <ColumnsForm />

            <SwimlanesForm />
        </Stack>
    );
};
