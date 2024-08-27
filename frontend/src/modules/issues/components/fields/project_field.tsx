import { skipToken } from "@reduxjs/toolkit/query";
import { FC, forwardRef, useMemo } from "react";
import { projectApi } from "store";
import { SelectField, SelectFieldOptionType } from "./select_field";

type ProjectFieldProps = {
    value: string;
    onChange: (value: string) => void;
    label: string;
};

export const ProjectField: FC<ProjectFieldProps> = forwardRef(
    ({ value, onChange, label }, ref) => {
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
                loading={isLoading}
                options={options}
                value={value}
                cardValue={fullProject?.payload.name || "?"}
                onChange={(value) => onChange(value as string)}
                label={label}
                onOpened={trigger}
                ref={ref}
                id="projects"
            />
        );
    },
);
