import type { FC, SyntheticEvent } from "react";
import { useMemo } from "react";
import { projectApi } from "store";
import type { IssueProjectT } from "types";
import { SelectField } from "./select_field";
import { cardLabelGetter } from "./utils";

type ProjectFieldProps = {
    value?: IssueProjectT;
    label: string;
    onChange: (project: IssueProjectT) => void;
    error?: boolean;
    rightAdornment?: boolean;
};

export const ProjectField: FC<ProjectFieldProps> = ({
    value,
    label,
    onChange,
    error,
    rightAdornment,
}) => {
    const [trigger, { data, isLoading }] = projectApi.useLazyListProjectQuery();

    const options = useMemo(() => {
        return (data?.payload.items || []) as IssueProjectT[];
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        option: IssueProjectT | IssueProjectT[] | null,
    ) => {
        if (!option) return undefined;
        if (Array.isArray(option)) onChange(option[0]);
        else onChange(option);
    };

    return (
        <SelectField
            id="projects"
            label={label}
            options={options}
            value={value}
            cardValue={value?.name || "?"}
            onChange={handleChange}
            rightAdornment={rightAdornment}
            onOpened={trigger}
            loading={isLoading}
            variant={error ? "error" : "standard"}
            getOptionLabel={(el) => el.name}
            getOptionDescription={(el) => el.slug}
            getOptionKey={(el) => el.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.name)
            }
        />
    );
};
