import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { FC, SyntheticEvent, useCallback, useMemo, useState } from "react";
import { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import { BasicCustomFieldT } from "shared/model/types";

interface ISwimlaneFieldSelectProps {
    value?: BasicCustomFieldT | null;
    onChange: (value: BasicCustomFieldT | null) => void;
    error?: Merge<FieldError, any>;
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
    }, [data]) as BasicCustomFieldT[];

    const handleOpen = useCallback(() => {
        setIsOpen(true);

        fetchSwimlaneFields({ project_id: projectId });
    }, [setIsOpen, projectId]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (
        _: SyntheticEvent,
        value: BasicCustomFieldT | null,
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
            isOptionEqualToValue={(option, value) => option.id === value.id}
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
