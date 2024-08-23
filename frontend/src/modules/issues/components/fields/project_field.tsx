import { skipToken } from "@reduxjs/toolkit/query";
import {
    FC,
    forwardRef,
    SyntheticEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import FieldCard from "../../../../components/fields/field_card/field_card.tsx";
import {
    FormAutocomplete,
    FormAutocompleteValueType,
} from "../../../../components/fields/field_form/components/form_autocomplete/form_autocomplete.tsx";
import { projectApi } from "../../../../store";

type ProjectFieldProps = {
    value: string;
    onChange: (value: string) => void;
    label: string;
};

export const ProjectField: FC<ProjectFieldProps> = forwardRef(
    ({ value, onChange, label }, ref) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const [fetch, { data, isLoading }] =
            projectApi.useLazyListProjectQuery();

        const { data: fullProject } = projectApi.useGetProjectQuery(
            value ?? skipToken,
        );

        useEffect(() => {
            if (anchorEl) fetch();
        }, [anchorEl]);

        const options: FormAutocompleteValueType[] = useMemo(() => {
            if (!data) return [];
            return data.payload.items.map(({ id, name, description }) => ({
                label: name,
                description: description,
                id: id,
            }));
        }, [data]);

        const handleChange = (
            _: SyntheticEvent,
            value:
                | FormAutocompleteValueType
                | FormAutocompleteValueType[]
                | null,
        ) => {
            if (!value) onChange("");
            else if (Array.isArray(value)) onChange(value[0].id);
            else onChange(value.id);
        };

        return (
            <>
                <FieldCard
                    label={label}
                    value={fullProject?.payload.name || "?"}
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                />
                <FormAutocomplete
                    ref={ref}
                    anchorEl={anchorEl}
                    id="projects"
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    loading={isLoading}
                    options={options}
                    onChange={handleChange}
                />
            </>
        );
    },
);
