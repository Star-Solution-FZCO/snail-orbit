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
import { customFieldsApi } from "shared/model";
import type { AgileBoardT } from "shared/model/types";
import type {
    ShortOptionOutput,
    UserOutput,
} from "shared/model/types/backend-schema.gen";
import { useListQueryParams } from "shared/utils";
import { getFieldValue } from "../../../utils/normalizeFieldValue";

const getOptionValue = (option: UserOutput | ShortOptionOutput): string => {
    return "value" in option ? option.value : option.name;
};

export const ColumnsForm: FC = () => {
    const { t } = useTranslation();

    const [selectInput, setSelectInput] = useState<string>("");
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const { control } = useFormContext<AgileBoardT>();

    const field = useWatch({
        name: "columns.field",
        control,
    });

    const columns = useWatch({
        control,
        name: "columns.values",
    });

    const { fields, append, remove } = useFieldArray<AgileBoardT>({
        control,
        name: "columns.values",
    });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        customFieldsApi.useLazyListGroupSelectOptionsQuery();

    const handleSelectOpen = () => {
        fetchOptions({ gid: field.gid, ...listQueryParams });
    };

    const filteredOptions = useMemo(() => {
        return (
            options?.payload?.items.filter(
                (option) =>
                    !columns.some(
                        (column) =>
                            !!column &&
                            getFieldValue(column) === getOptionValue(option),
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
                        name={`columns.values.${index}` as const}
                        render={({
                            field: { value, onChange, ...rest },
                            fieldState: { invalid, error },
                        }) => (
                            <TextField
                                placeholder={t(`agileBoards.form.column`)}
                                error={invalid}
                                helperText={error?.message}
                                variant="outlined"
                                size="small"
                                fullWidth
                                disabled
                                value={getFieldValue(value)}
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
                getOptionLabel={getOptionValue}
                inputValue={selectInput}
                value={null}
                onChange={(_, option) => {
                    setSelectInput("");
                    if (option)
                        append({
                            id: "id" in option ? option.id : option.value,
                            value: getOptionValue(option),
                            color:
                                "color" in option
                                    ? option.color || undefined
                                    : undefined,
                            is_archived: false,
                        });
                }}
                disableCloseOnSelect
            />
        </Stack>
    );
};
