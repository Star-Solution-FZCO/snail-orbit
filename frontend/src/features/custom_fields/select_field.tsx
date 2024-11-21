import { AutocompleteValue } from "@mui/material";
import FieldCard from "components/fields/field_card/field_card";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import { FormAutocompleteValueType } from "components/fields/form_autocomplete/form_autocomplete_content";
import { ReactNode, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { SelectOptionType } from "./utils";

type SelectFieldReturnType<
    T extends boolean | undefined,
    K extends SelectOptionType,
> = T extends true ? K[] : K;

type ValueType<T extends boolean | undefined> = AutocompleteValue<
    SelectOptionType,
    T,
    boolean | undefined,
    false
>;

type SelectFieldProps<
    T extends boolean | undefined,
    K extends SelectOptionType,
> = {
    id: string;
    options: SelectOptionType[];
    label: string;
    value?: ValueType<T>;
    cardValue?: string;
    onChange: (value: SelectFieldReturnType<T, K>) => void;
    onOpened?: () => unknown;
    loading?: boolean;
    multiple?: T;
    variant?: "standard" | "error";
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
};

export const SelectField = <
    T extends boolean | undefined,
    K extends SelectOptionType,
>({
    id,
    options,
    label,
    value,
    cardValue: customCardValue,
    onChange,
    onOpened,
    loading,
    multiple,
    variant = "standard",
    leftAdornment,
    rightAdornment,
}: SelectFieldProps<T, K>) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const initialValue = useMemo(() => {
        if (multiple && !value) return [] as unknown as ValueType<T>;

        if (!value) return undefined;

        return value;
    }, [options, value]);

    const cardValue = useMemo(() => {
        if (customCardValue) return customCardValue;

        if (!value) return undefined;

        if (!Array.isArray(value)) return value.label;
        else return value.map((el) => el.label).join(", ");
    }, [multiple, value, customCardValue]);

    const handleChange = (
        _: SyntheticEvent,
        value: FormAutocompleteValueType | FormAutocompleteValueType[] | null,
    ) => {
        onChange(value as SelectFieldReturnType<T, K>);
    };

    useEffect(() => {
        if (anchorEl) onOpened?.();
    }, [anchorEl]);

    return (
        <>
            <FieldCard
                label={label}
                value={cardValue || "?"}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                variant={variant}
                orientation="vertical"
                leftAdornment={leftAdornment}
                rightAdornment={rightAdornment}
            />

            <FormAutocompletePopover
                id={id}
                anchorEl={anchorEl}
                options={options}
                value={initialValue}
                onClose={() => setAnchorEl(null)}
                onChange={handleChange}
                open={!!anchorEl}
                multiple={multiple}
                loading={loading}
                isOptionEqualToValue={(option, value) => option.id === value.id}
            />
        </>
    );
};
