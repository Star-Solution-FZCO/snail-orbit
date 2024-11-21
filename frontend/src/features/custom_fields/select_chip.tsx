import { AutocompleteValue, Tooltip } from "@mui/material";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import { FormAutocompleteValueType } from "components/fields/form_autocomplete/form_autocomplete_content";
import { ReactNode, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { FieldChip } from "../../components/fields/field_chip/field_chip";

export type SelectChipOptionType = FormAutocompleteValueType & { id: string };

type SelectChipReturnType<
    T extends boolean | undefined,
    K extends SelectChipOptionType,
> = T extends true ? K[] : K;

type ValueType<T extends boolean | undefined> = AutocompleteValue<
    SelectChipOptionType,
    T,
    boolean | undefined,
    false
>;

type SelectChipProps<
    T extends boolean | undefined,
    K extends SelectChipOptionType,
> = {
    id: string;
    options: SelectChipOptionType[];
    label: string;
    value?: ValueType<T>;
    chipValue?: string;
    onChange: (value: SelectChipReturnType<T, K>) => void;
    onOpened?: () => unknown;
    loading?: boolean;
    multiple?: T;
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
};

export const SelectChip = <
    T extends boolean | undefined,
    K extends SelectChipOptionType,
>({
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
}: SelectChipProps<T, K>) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const initialValue = useMemo(() => {
        if (multiple && !value) return [] as unknown as ValueType<T>;

        if (!value) return undefined;

        return value;
    }, [options, value]);

    const cardValue = useMemo(() => {
        if (customChipValue) return customChipValue;

        if (!value) return "?";

        if (!Array.isArray(value)) return value.label;
        else {
            if (!value.length) return "?";
            return (
                value[0].label +
                (value.length > 1 ? `+${value.length - 1}` : "")
            );
        }
    }, [multiple, value, customChipValue]);

    const tooltipValue = useMemo(() => {
        if (customChipValue) return customChipValue;

        if (!value) return "?";

        if (!Array.isArray(value)) return value.label;
        else return value.map((el) => el.label).join(", ");
    }, [multiple, value, customChipValue]);

    const handleChange = (
        _: SyntheticEvent,
        value: FormAutocompleteValueType | FormAutocompleteValueType[] | null,
    ) => {
        onChange(value as SelectChipReturnType<T, K>);
    };

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
