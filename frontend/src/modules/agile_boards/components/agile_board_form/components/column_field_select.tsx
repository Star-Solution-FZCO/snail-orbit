import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import type { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardCardFieldT } from "shared/model/types";

interface IColumnFieldSelectProps {
    value?: AgileBoardCardFieldT;
    onChange: (value: AgileBoardCardFieldT) => void;
    error?: Merge<FieldError, unknown>;
    projectId: string[];
}

const ColumnFieldSelect: FC<IColumnFieldSelectProps> = ({
    value,
    onChange,
    error,
    projectId,
}) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [fetchCustomFields, { data, isLoading }] =
        agileBoardApi.useLazyListAvailableColumnsQuery();

    const options = useMemo(() => {
        if (!data) return [];
        return data.payload.items;
    }, [data]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);

        fetchCustomFields({ project_id: projectId });
    }, [fetchCustomFields, projectId]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (
        _: SyntheticEvent,
        value: AgileBoardCardFieldT | null,
    ) => {
        if (value && onChange) onChange(value);
    };

    return (
        <Autocomplete
            value={value || null}
            options={options}
            open={isOpen}
            onOpen={handleOpen}
            onClose={handleClose}
            onChange={handleChange}
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) => option.gid === value.gid}
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
        />
    );
};

export { ColumnFieldSelect };
