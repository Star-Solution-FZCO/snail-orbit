import { AutocompleteValue } from "@mui/material";
import FieldCard from "components/fields/field_card/field_card";
import {
    FormAutocompletePopover,
    FormAutocompletePopoverProps,
} from "components/fields/form_autocomplete/form_autocomplete";
import { ReactNode, useEffect, useMemo, useState } from "react";

type SelectFieldProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
> = Omit<
    FormAutocompletePopoverProps<Value, Multiple, DisableClearable>,
    "open"
> & {
    label: string;
    cardValue?: string;
    onOpened?: () => unknown;
    loading?: boolean;
    variant?: "standard" | "error";
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
    getCardLabelString?: (
        el: AutocompleteValue<Value, Multiple, DisableClearable, false>,
    ) => string | string[] | undefined | null;
};

export const SelectField = <
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
>(
    props: SelectFieldProps<Value, Multiple, DisableClearable>,
) => {
    const {
        id,
        options,
        label,
        value,
        cardValue: customCardValue,
        onChange,
        onOpened,
        multiple,
        variant = "standard",
        leftAdornment,
        rightAdornment,
        getCardLabelString,
        ...rest
    } = props;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const cardValue = useMemo(() => {
        if (customCardValue) return customCardValue;
        if (!value || !getCardLabelString) return "?";

        const labelStrings = getCardLabelString(value);

        if (!Array.isArray(labelStrings)) return labelStrings;
        else return labelStrings.join(", ");
    }, [multiple, value, customCardValue]);

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
                data-field-card-id={id}
            />

            <FormAutocompletePopover
                id={id}
                anchorEl={anchorEl}
                options={options}
                value={value}
                onClose={() => setAnchorEl(null)}
                onChange={onChange}
                open={!!anchorEl}
                multiple={multiple}
                {...rest}
            />
        </>
    );
};
