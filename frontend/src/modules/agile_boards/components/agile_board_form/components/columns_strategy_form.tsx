import {
    FormControl,
    FormLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT } from "shared/model/types";

export const ColumnsStrategyForm: FC = () => {
    const { t } = useTranslation();

    const { control } = useFormContext<AgileBoardT>();

    const strategy = useWatch({ control, name: "ui_settings.columnsStrategy" });

    return (
        <Stack gap={1}>
            <FormLabel>{t("ui_settings.columnsStrategy.label")}</FormLabel>

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

            <Stack direction="row" gap={1}>
                <Controller
                    control={control}
                    name={"ui_settings.columnsStrategy"}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="columnsStrategy-label">
                                {t("agileBoards.form.columnsStrategy")}
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="columnsStrategy-label"
                                id="columnsStrategy"
                                size="small"
                            >
                                <MenuItem value="column">
                                    {t(
                                        "agileBoards.form.columnsStrategy.column",
                                    )}
                                </MenuItem>
                                <MenuItem value="maxWidth">
                                    {t(
                                        "agileBoards.form.columnsStrategy.maxWidth",
                                    )}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                {strategy === "column" && (
                    <Controller
                        control={control}
                        name={"ui_settings.columns"}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <TextField
                                {...field}
                                label={t("agileBoards.form.columns")}
                                error={invalid}
                                helperText={error?.message || ""}
                                variant="outlined"
                                size="small"
                                fullWidth
                                type="number"
                            />
                        )}
                    />
                )}

                {strategy === "maxWidth" && (
                    <Controller
                        control={control}
                        name={"ui_settings.columnMaxWidth"}
                        render={({ field, fieldState: { error, invalid } }) => (
                            <TextField
                                {...field}
                                label={t("agileBoards.form.columnMaxWidth")}
                                error={invalid}
                                helperText={error?.message || ""}
                                variant="outlined"
                                size="small"
                                fullWidth
                                type="number"
                            />
                        )}
                    />
                )}
            </Stack>
        </Stack>
    );
};
