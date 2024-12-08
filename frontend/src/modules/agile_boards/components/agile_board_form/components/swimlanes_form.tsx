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
import { customFieldsApi } from "store";
import type {
    BasicUserT,
    EnumOptionT,
    StateOptionT,
    VersionOptionT,
} from "types";
import { useListQueryParams } from "utils";
import type { AgileBoardFormData } from "../agile_board_form.schema";

const getOptionValue = (
    option: EnumOptionT | StateOptionT | BasicUserT | VersionOptionT,
): string => {
    return "value" in option ? option.value : option.name;
};

export const SwimlanesForm: FC = () => {
    const { t } = useTranslation();

    const [selectInput, setSelectInput] = useState<string>("");
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const { control } = useFormContext<AgileBoardFormData>();

    const field = useWatch({
        name: "swimlane_field",
        control,
    });

    const swimlanes = useWatch({
        control,
        name: "swimlanes",
    });

    const { fields, append, remove } = useFieldArray<AgileBoardFormData>({
        control,
        name: "swimlanes",
    });

    const [fetchOptions, { data: options, isLoading: isOptionsLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleSelectOpen = () => {
        if (field) fetchOptions({ id: field.id, ...listQueryParams });
    };

    const filteredOptions = useMemo(() => {
        return (
            options?.payload?.items.filter(
                (option) =>
                    !swimlanes.some(
                        ({ value }) => value === getOptionValue(option),
                    ),
            ) || []
        );
    }, [options, swimlanes]);

    console.log(fields);

    return (
        <Stack gap={1}>
            <FormLabel>{t("agileBoards.form.swimlanes")}</FormLabel>

            {fields.map((field, index) => (
                <Stack
                    direction="row"
                    alignItems="center"
                    key={field.id}
                    gap={1}
                >
                    <Controller
                        control={control}
                        name={`swimlanes.${index}` as const}
                        render={({
                            field: { value, onChange, ...rest },
                            fieldState: { invalid, error },
                        }) => (
                            <TextField
                                placeholder={t(`agileBoards.form.swimlane`)}
                                error={invalid}
                                helperText={
                                    error?.message ? t(error.message) : null
                                }
                                variant="outlined"
                                size="small"
                                fullWidth
                                disabled
                                value={value.value}
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
                        placeholder={t(
                            "agileBoard.swimlanes.selectPlaceholder",
                        )}
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
                            value: getOptionValue(option),
                            color:
                                "color" in option
                                    ? option.color || undefined
                                    : undefined,
                        });
                }}
                disableCloseOnSelect
            />
        </Stack>
    );
};
