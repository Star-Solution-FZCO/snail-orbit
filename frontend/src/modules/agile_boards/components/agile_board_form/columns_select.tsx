import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import {
    forwardRef,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "store";
import { ColumnT } from "types";

export type ColumnsSelectProps = {
    projectId: string[];
    value?: string[];
    onChange?: (value: string[]) => void;
    error?: Merge<FieldError, (FieldError | undefined)[]>;
};

export const ColumnsSelect = forwardRef<HTMLElement, ColumnsSelectProps>(
    ({ value, onChange, error, projectId }, ref) => {
        const { t } = useTranslation();

        const [isOpen, setIsOpen] = useState(false);

        const [fetchAvailableColumns, { data, isLoading, isSuccess }] =
            agileBoardApi.useLazyListAvailableColumnsQuery();

        const options = useMemo(() => {
            return data?.payload.items || [];
        }, [data]);

        const autocompleteValue = useMemo(() => {
            return options.filter((option) => value?.includes(option.id));
        }, [options, value]);

        const handleOpen = useCallback(() => {
            setIsOpen(true);

            if (!isLoading && !isSuccess)
                fetchAvailableColumns({ project_id: projectId });
        }, [setIsOpen]);

        const handleClose = useCallback(() => {
            setIsOpen(false);
        }, [setIsOpen]);

        const handleChange = (_: SyntheticEvent, value: ColumnT[]) => {
            if (onChange) onChange(value.map((el) => el.id));
        };

        useEffect(() => {
            if (value && value.length && !isLoading && !isSuccess) {
                fetchAvailableColumns({ project_id: projectId });
            }
        }, [value, isLoading, isSuccess]);

        return (
            <Autocomplete
                value={autocompleteValue}
                options={options}
                open={isOpen}
                onOpen={handleOpen}
                onClose={handleClose}
                onChange={handleChange}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t("agileBoards.form.columns")}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoading ? (
                                        <CircularProgress
                                            color="inherit"
                                            size={12}
                                        />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        error={!!error}
                        helperText={t(error?.message || "")}
                        size="small"
                    />
                )}
                loading={isLoading}
                filterSelectedOptions
                multiple
                ref={ref}
            />
        );
    },
);
