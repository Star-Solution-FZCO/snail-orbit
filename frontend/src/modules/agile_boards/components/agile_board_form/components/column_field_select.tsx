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
import { AgileBoardColumnField } from "../agile_board_form.schema";

interface IColumnFieldSelectProps {
    value?: AgileBoardColumnField;
    onChange: (value: AgileBoardColumnField) => void;
    error?: Merge<FieldError, any>;
    projectId: string[];
}

const ColumnFieldSelect = forwardRef<HTMLElement, IColumnFieldSelectProps>(
    ({ value, onChange, error, projectId }, ref) => {
        const { t } = useTranslation();

        const [isOpen, setIsOpen] = useState<boolean>(false);

        const [fetchCustomFields, { data, isLoading, isSuccess }] =
            agileBoardApi.useLazyListAvailableColumnsQuery();

        const options = useMemo(() => {
            if (!data) return [];
            return data.payload.items;
        }, [data]) as AgileBoardColumnField[];

        const handleOpen = useCallback(() => {
            setIsOpen(true);

            fetchCustomFields({ project_id: projectId });
        }, [setIsOpen, projectId]);

        const handleClose = useCallback(() => {
            setIsOpen(false);
        }, [setIsOpen]);

        const handleChange = (
            _: SyntheticEvent,
            value: AgileBoardColumnField | null,
        ) => {
            if (value && onChange) onChange(value);
        };

        useEffect(() => {
            if (value) {
                fetchCustomFields({ project_id: projectId });
            }
        }, [value, isLoading, isSuccess, projectId]);

        return (
            <Autocomplete
                value={value || null}
                options={options}
                open={isOpen}
                onOpen={handleOpen}
                onClose={handleClose}
                onChange={handleChange}
                getOptionLabel={(option) => option?.name || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={t("agileBoards.form.columnField")}
                        slotProps={{
                            input: {
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
                            },
                        }}
                        error={!!error}
                        helperText={t(error?.message || "")}
                        size="small"
                    />
                )}
                loading={isLoading}
                filterSelectedOptions
                ref={ref}
            />
        );
    },
);

export { ColumnFieldSelect };
