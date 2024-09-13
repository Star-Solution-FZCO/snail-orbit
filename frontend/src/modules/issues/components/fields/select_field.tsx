import { AutocompleteValue } from "@mui/material";
import FieldCard from "components/fields/field_card/field_card";
import { FormAutocompletePopover } from "components/fields/form_autocomplete/form_autocomplete";
import { FormAutocompleteValueType } from "components/fields/form_autocomplete/form_autocomplete_content";
import {
    ForwardedRef,
    forwardRef,
    SyntheticEvent,
    useEffect,
    useMemo,
    useState,
} from "react";

export type SelectFieldOptionType = FormAutocompleteValueType & { id: string };

type SelectFieldValueType<T extends boolean | undefined> = T extends true
    ? string[]
    : string;

type ValueType<T extends boolean | undefined> = AutocompleteValue<
    SelectFieldOptionType,
    T,
    boolean | undefined,
    false
>;

type SelectFieldProps<T extends boolean | undefined> = {
    id: string;
    options: SelectFieldOptionType[];
    label: string;
    value: SelectFieldValueType<T>;
    cardValue?: string;
    onChange: (value: SelectFieldValueType<T>) => void;
    onOpened?: () => unknown;
    loading?: boolean;
    multiple?: T;
    variant?: "standard" | "error";
};

const SelectFieldComp = <T extends boolean | undefined>(
    {
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
    }: SelectFieldProps<T>,
    ref: ForwardedRef<unknown>,
) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const initialValue = useMemo(() => {
        if (multiple && !value) return [] as unknown as ValueType<T>;

        if (!value) return undefined;

        if (!Array.isArray(value)) return undefined;

        return options.filter((el) => value.includes(el.id)) as ValueType<T>;
    }, [options, value]);

    const cardValue = useMemo(() => {
        if (customCardValue) return customCardValue;

        if (!value || !value.length) return undefined;

        if (!Array.isArray(value)) return value as string;
        else return value.join(", ");
    }, [multiple, value, customCardValue]);

    const handleChange = (
        _: SyntheticEvent,
        value: FormAutocompleteValueType | FormAutocompleteValueType[] | null,
    ) => {
        const getValueId = (val: FormAutocompleteValueType | null) =>
            val ? val.id : "";

        const getMultipleValueIds = (
            val: FormAutocompleteValueType[] | null,
        ) => (val ? val.map((el) => el.id) : []);

        if (multiple) {
            const result = Array.isArray(value)
                ? getMultipleValueIds(value)
                : getMultipleValueIds(value ? [value] : null);
            onChange(result as SelectFieldValueType<T>);
        } else {
            const result = Array.isArray(value)
                ? getValueId(value[0])
                : getValueId(value);
            onChange(result as SelectFieldValueType<T>);
        }
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
            />

            <FormAutocompletePopover
                id={id}
                ref={ref}
                anchorEl={anchorEl}
                options={options}
                value={initialValue}
                onClose={() => setAnchorEl(null)}
                onChange={handleChange}
                open={!!anchorEl}
                multiple={multiple}
                loading={loading}
            />
        </>
    );
};

export const SelectField = forwardRef(SelectFieldComp);
