import DeleteIcon from "@mui/icons-material/Delete";
import {
    Autocomplete,
    CircularProgress,
    FormLabel,
    IconButton,
    Stack,
    TextField,
} from "@mui/material";
import type { FC } from "react";
import { useMemo, useState } from "react";
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import type { AgileBoardFormData } from "../agile_board_form.schema";

export const CardColorsFieldsForm: FC = () => {
    const { t } = useTranslation();

    const [selectInput, setSelectInput] = useState<string>("");
    const { control } = useFormContext<AgileBoardFormData>();

    const colorFields = useWatch({
        control,
        name: "card_colors_fields",
    });

    const { fields, append, remove } = useFieldArray<AgileBoardFormData>({
        control,
        name: "card_colors_fields",
    });

    const selectedProjects = useWatch({ control, name: "projects" });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        agileBoardApi.useLazyListAvailableColorsCustomFieldsQuery();

    const handleSelectOpen = () => {
        fetchOptions({
            project_id: selectedProjects.map((project) => project.id),
        });
    };

    const filteredOptions = useMemo(() => {
        return (
            options?.payload?.items.filter(
                (option) => !colorFields.some(({ id }) => id === option.id),
            ) || []
        );
    }, [options, colorFields]);

    return (
        <Stack gap={1}>
            <FormLabel>{t("cardColorFieldsForm.form.fields")}</FormLabel>

            {fields.map((field, index) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    key={field.id}
                    gap={1}
                >
                    <Controller
                        control={control}
                        name={`card_colors_fields.${index}` as const}
                        render={({
                            field: { value, onChange, ...rest },
                            fieldState: { invalid, error },
                        }) => (
                            <TextField
                                placeholder={t(
                                    `cardColorFieldsForm.form.field`,
                                )}
                                error={invalid}
                                helperText={
                                    error?.message ? t(error.message) : null
                                }
                                variant="outlined"
                                size="small"
                                disabled
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
            <Autocomplete
                onOpen={handleSelectOpen}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={t("cardColorFieldsForm.selectPlaceholder")}
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isOptionsLoading ? (
                                            <CircularProgress
                                                color="inherit"
                                                size={12}
                                            />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            },
                        }}
                        size="small"
                    />
                )}
                options={filteredOptions}
                getOptionLabel={(option) => option.name}
                inputValue={selectInput}
                value={null}
                onChange={(_, option) => {
                    setSelectInput("");
                    if (option) append({ ...option });
                }}
                disableCloseOnSelect
            />
        </Stack>
    );
};
