import DeleteIcon from "@mui/icons-material/Delete";
import {
    Autocomplete,
    CircularProgress,
    FormLabel,
    IconButton,
    Stack,
    TextField,
} from "@mui/material";
import { FC, useMemo, useState } from "react";
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { BasicUserT, EnumOptionT, StateOptionT } from "types";
import { useListQueryParams } from "utils";
import { AgileBoardFormData } from "./agile_board_form.schema";

const getOptionValue = (
    option: EnumOptionT | StateOptionT | BasicUserT,
): string => {
    return "value" in option ? option.value : option.name;
};

export const ColumnsForm: FC = () => {
    const { t } = useTranslation();

    const [selectInput, setSelectInput] = useState<string>("");
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const { control } = useFormContext<AgileBoardFormData>();

    const field = useWatch({
        name: "column_field",
        control,
    });

    const columns = useWatch({
        control,
        name: "columns",
    });

    const { fields, append, remove } = useFieldArray<AgileBoardFormData>({
        control,
        name: "columns",
    });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleSelectOpen = () => {
        fetchOptions({ id: field.id, ...listQueryParams });
    };

    const filteredOptions = useMemo(() => {
        return (
            options?.payload?.items.filter(
                (option) =>
                    !columns.some(
                        ({ name }) => name === getOptionValue(option),
                    ),
            ) || []
        );
    }, [options, columns]);

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
            <Autocomplete
                onOpen={handleSelectOpen}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={t("agileBoard.columns.selectPlaceholder")}
                        InputProps={{
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
                        }}
                        size="small"
                    />
                )}
                options={filteredOptions}
                getOptionLabel={getOptionValue}
                inputValue={selectInput}
                value={null}
                onChange={(_, option) => {
                    setSelectInput("");
                    if (option)
                        append({
                            name: getOptionValue(option),
                        });
                }}
                disableCloseOnSelect
            />
        </Stack>
    );
};
