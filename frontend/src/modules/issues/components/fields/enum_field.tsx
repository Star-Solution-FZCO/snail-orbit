import { FC, forwardRef, SyntheticEvent, useMemo, useState } from "react";
import FieldCard from "../../../../components/fields/field_card/field_card.tsx";
import {
    FormAutocomplete,
    FormAutocompleteValueType,
} from "../../../../components/fields/field_form/components/form_autocomplete/form_autocomplete.tsx";
import { EnumOptionT } from "../../../../types";

type EnumFieldProps = {
    value: string;
    onChange: (value: string) => void;
    options: EnumOptionT[];
    label: string;
};

export const EnumField: FC<EnumFieldProps> = forwardRef(
    ({ value, onChange, options, label }, ref) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const parsedOptions: FormAutocompleteValueType[] = useMemo(() => {
            if (!options) return [];
            return options.map(({ value, color }) => ({
                label: value,
                id: value,
                color,
            }));
        }, [options]);

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
                    value={
                        options.find((el) => el.value === value)?.value || "?"
                    }
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                />
                <FormAutocomplete
                    ref={ref}
                    anchorEl={anchorEl}
                    id="projects"
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    options={parsedOptions}
                    onChange={handleChange}
                />
            </>
        );
    },
);
