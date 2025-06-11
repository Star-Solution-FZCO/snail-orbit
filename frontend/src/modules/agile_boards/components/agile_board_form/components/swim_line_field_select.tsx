import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import type { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import { type AgileBoardCardFieldT } from "shared/model/types";

interface ISwimlaneFieldSelectProps {
    value?: AgileBoardCardFieldT | null;
    onChange: (value: AgileBoardCardFieldT | null) => void;
    error?: Merge<FieldError, unknown>;
    projectId: string[];
}

export const SwimlaneFieldSelect: FC<ISwimlaneFieldSelectProps> = ({
    value,
    onChange,
    error,
    projectId,
}) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [fetchSwimlaneFields, { data, isLoading }] =
        agileBoardApi.useLazyListAvailableSwimlanesQuery();

    const options = useMemo(() => {
        if (!data) return [];
        return data.payload.items;
    }, [data]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);

        fetchSwimlaneFields({ project_id: projectId });
    }, [fetchSwimlaneFields, projectId]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (
        _: SyntheticEvent,
        value: AgileBoardCardFieldT | null,
    ) => {
        if (onChange) onChange(value);
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
                    label={t("agileBoards.form.swimlaneField")}
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
