import { skipToken } from "@reduxjs/toolkit/query";
import { FC, forwardRef, useMemo } from "react";
import { projectApi } from "store";
import { SelectField, SelectFieldOptionType } from "./select_field";

type ProjectFieldProps = {
    value: string;
    label: string;
    onChange: (value: string) => void;
    error?: boolean;
};

export const ProjectField: FC<ProjectFieldProps> = forwardRef(
    ({ value, label, onChange, error }, ref) => {
        const [trigger, { data, isLoading }] =
            projectApi.useLazyListProjectQuery();

        const { data: fullProject } = projectApi.useGetProjectQuery(
            value ?? skipToken,
        );

        const options: SelectFieldOptionType[] = useMemo(() => {
            if (!data) return [];
            return data.payload.items.map(({ id, name, description }) => ({
                label: name,
                description: description,
                id: id,
            }));
        }, [data]);

        return (
            <SelectField
                id="projects"
                ref={ref}
                label={label}
                options={options}
                value={value}
                cardValue={fullProject?.payload.name || "?"}
                onChange={(value) => onChange(value as string)}
                onOpened={trigger}
                loading={isLoading}
                error={error}
            />
        );
    },
);
