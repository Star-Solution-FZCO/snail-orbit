import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { SyntheticEvent } from "react";
import { forwardRef, useCallback, useMemo, useState } from "react";
import type { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { BasicProjectT } from "shared/model/types";
import { noLimitListQueryParams } from "shared/utils";

export type ProjectSelectProps = {
    value?: BasicProjectT[];
    onChange?: (projects: BasicProjectT[]) => void;
    error?: Merge<FieldError, (FieldError | undefined)[]>;
    readOnly?: boolean;
};

export const ProjectSelect = forwardRef<HTMLElement, ProjectSelectProps>(
    ({ value, onChange, error, readOnly = false }, ref) => {
        const { t } = useTranslation();

        const [isOpen, setIsOpen] = useState(false);

        const { data, isLoading } = projectApi.useListProjectQuery(
            noLimitListQueryParams,
            { skip: !isOpen },
        );

        const options = useMemo(() => {
            return data?.payload.items || [];
        }, [data]) as BasicProjectT[];

        const handleOpen = useCallback(() => {
            setIsOpen(true);
        }, [setIsOpen]);

        const handleClose = useCallback(() => {
            setIsOpen(false);
        }, [setIsOpen]);

        const handleChange = (_: SyntheticEvent, value: BasicProjectT[]) => {
            if (onChange) onChange(value);
        };

        return (
            <Autocomplete
                ref={ref}
                value={value || []}
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
                        label={t("form.projects")}
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
                readOnly={readOnly}
                filterSelectedOptions
                multiple
            />
        );
    },
);
