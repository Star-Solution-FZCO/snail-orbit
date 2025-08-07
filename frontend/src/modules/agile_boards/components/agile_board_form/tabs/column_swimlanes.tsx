import { Stack } from "@mui/material";
import type { FC } from "react";
import { ColumnsForm } from "../components/columns_form";
import { SwimlanesForm } from "../components/swimlanes_form";

export const ColumnSwimlanes: FC<{ controlsDisabled?: boolean }> = (props) => {
    return (
        <Stack gap={1}>
            <ColumnsForm {...props} />

            <SwimlanesForm {...props} />
        </Stack>
    );
};
