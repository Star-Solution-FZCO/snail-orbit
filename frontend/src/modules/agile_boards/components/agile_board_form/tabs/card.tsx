import { Stack } from "@mui/material";
import type { FC } from "react";
import { CardColorsFieldsForm } from "../components/card_colors_fields_form";
import { CardFieldsForm } from "../components/card_fields_form";
import { ColumnsStrategyForm } from "../components/columns_strategy_form";

export const Card: FC = () => {
    return (
        <Stack direction="column" gap={2}>
            <CardFieldsForm />

            <ColumnsStrategyForm />

            <CardColorsFieldsForm />
        </Stack>
    );
};
