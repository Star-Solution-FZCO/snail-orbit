import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import {
    FC,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "../../../store";
import { ProjectT } from "../../../types";

export type ProjectSelectProps = {
    onChange?: (value: string[]) => void;
    value?: string[];
};

export const ProjectSelect: FC<ProjectSelectProps> = ({ onChange, value }) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [
        fetchProjects,
        {
            data: projectsData,
            isLoading: isProjectsLoading,
            isSuccess: isProjectsLoaded,
        },
    ] = projectApi.useLazyListProjectQuery();

    const options = useMemo(() => {
        return projectsData?.payload.items || [];
    }, [projectsData]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        if (!isProjectsLoaded && !isProjectsLoading)
            fetchProjects({ limit: 0, offset: 0 });
    }, [setIsOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, [setIsOpen]);

    const handleChange = (_: SyntheticEvent, value: ProjectT[]) => {
        if (onChange) onChange(value.map((el) => el.id));
    };

    useEffect(() => {
        if (value && value.length && !isProjectsLoading && !isProjectsLoaded) {
            fetchProjects({ limit: 0, offset: 0 });
        }
    }, [value, isProjectsLoading, isProjectsLoaded]);

    return (
        <Autocomplete
            options={options}
            open={isOpen}
            onOpen={handleOpen}
            multiple
            onClose={handleClose}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name}
            loading={isProjectsLoading}
            onChange={handleChange}
            filterSelectedOptions
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    label={t("projectSelect.label")}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {isProjectsLoading ? (
                                    <CircularProgress
                                        color="inherit"
                                        size={12}
                                    />
                                ) : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};
