import { Stack, TextField } from "@mui/material";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AgileBoardFormData } from "../agile_board_form.schema";
import { CardFieldsForm } from "../components/card_fields_form";

export const Card: FC = () => {
    const { t } = useTranslation();

    const { control } = useFormContext<AgileBoardFormData>();

    return (
        <Stack direction="column" gap={2}>
            <CardFieldsForm />

            <Controller
                control={control}
                name={"ui_settings.minCardHeight"}
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("agileBoards.form.minCardHeight")}
                        error={invalid}
                        helperText={error?.message || ""}
                        variant="outlined"
                        size="small"
                        fullWidth
                        type="number"
                    />
                )}
            />
        </Stack>
    );
};
