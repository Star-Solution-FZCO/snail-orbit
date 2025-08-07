import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT } from "shared/model/types";

export const ColumnsStrategyForm: FC<{ controlsDisabled?: boolean }> = ({
    controlsDisabled = false,
}) => {
    const { t } = useTranslation();

    const { control } = useFormContext<AgileBoardT>();

    const strategy = useWatch({ control, name: "ui_settings.columnsStrategy" });

    return (
        <Stack gap={1} component={Paper} sx={{ p: 1 }}>
            <Box component="span">{t("ui_settings.columnsStrategy.label")}</Box>

            <Controller
                control={control}
                name={"ui_settings.minCardHeight"}
                render={({ field, fieldState: { error, invalid } }) => (
                    <TextField
                        {...field}
                        label={t("agileBoards.form.minCardHeight")}
                        error={invalid}
                        helperText={error?.message || ""}
                        slotProps={{ input: { readOnly: controlsDisabled } }}
                        type="number"
                        variant="outlined"
                        size="small"
                        fullWidth
                    />
                )}
            />

            <Stack direction="row" gap={1}>
                <Controller
                    control={control}
                    name={"ui_settings.columnsStrategy"}
                    render={({ field }) => (
                        <FormControl size="small" fullWidth>
                            <InputLabel id="columnsStrategy-label">
                                {t("agileBoards.form.columnsStrategy")}
                            </InputLabel>

                            <Select
                                {...field}
                                id="columnsStrategy"
                                labelId="columnsStrategy-label"
                                label={t("agileBoards.form.columnsStrategy")}
                                size="small"
                                readOnly={controlsDisabled}
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
                                slotProps={{
                                    input: { readOnly: controlsDisabled },
                                }}
                                type="number"
                                variant="outlined"
                                size="small"
                                fullWidth
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
                                slotProps={{
                                    input: { readOnly: controlsDisabled },
                                }}
                                type="number"
                                variant="outlined"
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                )}
            </Stack>
        </Stack>
    );
};
