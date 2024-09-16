import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import {
    FC,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { BasicCustomFieldT } from "types";

interface IColumnFieldSelectProps {
    value?: BasicCustomFieldT;
    onChange: (value: BasicCustomFieldT) => void;
    error?: Merge<FieldError, any>;
}

const ColumnFieldSelect: FC<IColumnFieldSelectProps> = ({
    value,
    onChange,
    error,
}) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [fetchCustomFields, { data, isLoading, isSuccess }] =
        customFieldsApi.useLazyListCustomFieldsQuery();

    const options = useMemo(() => {
        if (!data) return [];
        return data.payload.items.filter((field) =>
            ["enum", "state"].includes(field.type),
        );
    }, [data]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);

        if (!isLoading && !isSuccess)
            fetchCustomFields({ limit: 0, offset: 0 });
    }, [setIsOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (
        _: SyntheticEvent,
        value: BasicCustomFieldT | null,
    ) => {
        if (value && onChange) onChange(value);
    };

    useEffect(() => {
        if (value && !isLoading && !isSuccess) {
            fetchCustomFields({ limit: 0, offset: 0 });
        }
    }, [value, isLoading, isSuccess]);

    return (
        <Autocomplete
            value={value}
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
                    label={t("agileBoards.form.columnField")}
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
        />
    );
};

export { ColumnFieldSelect };
