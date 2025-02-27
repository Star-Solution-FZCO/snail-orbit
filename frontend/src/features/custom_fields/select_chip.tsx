import { AutocompleteValue, Tooltip } from "@mui/material";
import { FieldChip } from "components/fields/field_chip/field_chip";
import {
    FormAutocompletePopover,
    FormAutocompletePopoverProps,
} from "components/fields/form_autocomplete/form_autocomplete";
import { ReactNode, useEffect, useMemo, useState } from "react";

type SelectChipProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
> = Omit<
    FormAutocompletePopoverProps<Value, Multiple, DisableClearable>,
    "open"
> & {
    label: string;
    chipValue?: string;
    onOpened?: () => unknown;
    loading?: boolean;
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
    getCardLabelString?: (
        el: AutocompleteValue<Value, Multiple, DisableClearable, false>,
    ) => string | string[] | null | undefined;
};

export const SelectChip = <
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
>(
    props: SelectChipProps<Value, Multiple, DisableClearable>,
) => {
    const {
        id,
        options,
        label,
        value,
        chipValue: customChipValue,
        onChange,
        onOpened,
        loading,
        multiple,
        leftAdornment,
        rightAdornment,
        getCardLabelString,
        isOptionEqualToValue,
        onClick,
        ...rest
    } = props;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const cardValue = useMemo(() => {
        if (customChipValue) return customChipValue;
        if (!value || !getCardLabelString) return "?";
        const labelStrings = getCardLabelString(value);

        if (!Array.isArray(labelStrings)) return labelStrings;
        else {
            if (!labelStrings.length) return "?";
            return (
                labelStrings[0] +
                (labelStrings.length > 1 ? `+${labelStrings.length - 1}` : "")
            );
        }
    }, [multiple, value, customChipValue]);

    const tooltipValue = useMemo(() => {
        if (customChipValue) return customChipValue;
        if (!value || !getCardLabelString) return "?";
        const labelStrings = getCardLabelString(value);
        if (!labelStrings) return "?";

        if (!Array.isArray(labelStrings)) return labelStrings;
        else return labelStrings.join(", ");
    }, [multiple, value, customChipValue]);

    useEffect(() => {
        if (anchorEl) onOpened?.();
    }, [anchorEl]);

    return (
        <>
            <Tooltip
                arrow
                title={`${label}: ${tooltipValue}`}
                enterDelay={1000}
            >
                <FieldChip
                    leftAdornment={leftAdornment}
                    rightAdornment={rightAdornment}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    {cardValue}
                </FieldChip>
            </Tooltip>

            <FormAutocompletePopover
                id={id}
                anchorEl={anchorEl}
                options={options}
                value={value}
                onClose={() => setAnchorEl(null)}
                onChange={onChange}
                open={!!anchorEl}
                multiple={multiple}
                loading={loading}
                isOptionEqualToValue={isOptionEqualToValue}
                {...rest}
            />
        </>
    );
};
