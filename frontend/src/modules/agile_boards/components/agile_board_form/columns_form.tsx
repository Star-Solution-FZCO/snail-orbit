import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, FormLabel, IconButton, Stack, TextField } from "@mui/material";
import { FC } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AgileBoardFormData } from "./agile_board_form.schema";

export const ColumnsForm: FC = () => {
    const { t } = useTranslation();

    const { control } = useFormContext<AgileBoardFormData>();

    const { fields, append, remove } = useFieldArray<AgileBoardFormData>({
        control,
        name: "columns",
    });

    return (
        <Stack gap={1}>
            <FormLabel>{t("agileBoards.form.columns")}</FormLabel>

            {fields.map((field, index) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    key={field.id}
                    gap={1}
                >
                    <Controller
                        control={control}
                        name={`columns.${index}` as const}
                        render={({
                            field: { value, onChange, ...rest },
                            fieldState: { invalid, error },
                        }) => (
                            <TextField
                                label={t(`agileBoards.form.column`)}
                                error={invalid}
                                helperText={
                                    error?.message ? t(error.message) : null
                                }
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={value.name}
                                onChange={(e) =>
                                    onChange({ name: e.target.value })
                                }
                                {...rest}
                            />
                        )}
                    />
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => remove(index)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Stack>
            ))}

            <Button
                sx={{ alignSelf: "flex-start" }}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => append({ name: "" })}
            >
                {t("agileBoards.form.addColumn")}
            </Button>
        </Stack>
    );
};
