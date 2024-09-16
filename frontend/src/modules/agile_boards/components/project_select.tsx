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
import { projectApi } from "store";
import { ProjectT } from "types";

export type ProjectSelectProps = {
    value?: string[];
    onChange?: (value: string[]) => void;
    error?: Merge<FieldError, (FieldError | undefined)[]>;
};

export const ProjectSelect: FC<ProjectSelectProps> = ({
    value,
    onChange,
    error,
}) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);

    const [fetchProjects, { data, isLoading, isSuccess }] =
        projectApi.useLazyListProjectQuery();

    const options = useMemo(() => {
        return data?.payload.items || [];
    }, [data]);

    const autocompleteValue = useMemo(() => {
        return options.filter((option) => value?.includes(option.id));
    }, [options, value]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);

        if (!isLoading && !isSuccess) fetchProjects({ limit: 0, offset: 0 });
    }, [setIsOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (_: SyntheticEvent, value: ProjectT[]) => {
        if (onChange) onChange(value.map((el) => el.id));
    };

    useEffect(() => {
        if (value && value.length && !isLoading && !isSuccess) {
            fetchProjects({ limit: 0, offset: 0 });
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
        />
    );
};
