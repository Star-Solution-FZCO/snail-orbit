import { FC, useMemo } from "react";
import { projectApi } from "store";
import { IssueProjectT } from "../../../../types";
import { SelectField } from "./select_field";
import {
    ProjectSelectOptionT,
    projectToSelectOption,
    projectToSelectOptions,
} from "./utils";

type ProjectFieldProps = {
    value?: IssueProjectT;
    label: string;
    onChange: (project: IssueProjectT) => void;
    error?: boolean;
};

export const ProjectField: FC<ProjectFieldProps> = ({
    value,
    label,
    onChange,
    error,
}) => {
    const [trigger, { data, isLoading }] = projectApi.useLazyListProjectQuery();

    const options = useMemo(() => {
        return projectToSelectOptions(data?.payload.items);
    }, [data]);

    const parsedValue = useMemo(() => {
        if (!value) return undefined;
        return projectToSelectOption(value);
    }, [value]);

    const handleChange = (
        option: ProjectSelectOptionT | ProjectSelectOptionT[],
    ) => {
        if (Array.isArray(option)) onChange(option[0].original);
        else onChange(option.original);
    };

    return (
        <SelectField
            id="projects"
            label={label}
            options={options}
            value={parsedValue}
            cardValue={value?.name || "?"}
            onChange={handleChange}
            onOpened={trigger}
            loading={isLoading}
            variant={error ? "error" : "standard"}
        />
    );
};
