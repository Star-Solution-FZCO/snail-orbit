import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import type { SyntheticEvent } from "react";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import type { FieldError, Merge } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { BasicProjectT } from "shared/model/types";
import { projectApi } from "shared/model";
import { noLimitListQueryParams } from "shared/utils";

export type ProjectSelectProps = {
    value?: BasicProjectT[];
    onChange?: (projects: BasicProjectT[]) => void;
    error?: Merge<FieldError, (FieldError | undefined)[]>;
};

export const ProjectSelect = forwardRef<HTMLElement, ProjectSelectProps>(
    ({ value, onChange, error }, ref) => {
        const { t } = useTranslation();

        const [isOpen, setIsOpen] = useState(false);

        const [fetchProjects, { data, isLoading, isSuccess }] =
            projectApi.useLazyListProjectQuery();

        const options = useMemo(() => {
            return data?.payload.items || [];
        }, [data]) as BasicProjectT[];

        const handleOpen = useCallback(() => {
            setIsOpen(true);

            if (!isLoading && !isSuccess) fetchProjects(noLimitListQueryParams);
        }, [setIsOpen]);

        const handleClose = useCallback(() => {
            setIsOpen(false);
        }, [setIsOpen]);

        const handleChange = (_: SyntheticEvent, value: BasicProjectT[]) => {
            if (onChange) onChange(value);
        };

        useEffect(() => {
            if (value && value.length && !isLoading && !isSuccess) {
                fetchProjects(noLimitListQueryParams);
            }
        }, [value, isLoading, isSuccess]);

        return (
            <Autocomplete
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
                        label={t("agileBoards.form.projects")}
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
