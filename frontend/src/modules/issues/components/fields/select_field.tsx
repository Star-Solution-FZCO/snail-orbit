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
    value: SelectFieldValueType<T>;
    onChange: (value: SelectFieldValueType<T>) => void;
    options: SelectFieldOptionType[];
    label: string;
    multiple?: T;
    loading?: boolean;
    onOpened?: () => unknown;
    cardValue?: string;
    id: string;
};

const SelectFieldComp = <T extends boolean | undefined>(
    {
        value,
        onChange,
        options,
        label,
        multiple,
        loading,
        onOpened,
        cardValue: customCardValue,
        id,
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
        if (multiple) {
            if (!value) onChange([] as string[] as SelectFieldValueType<T>);
            else if (Array.isArray(value))
                onChange(value.map((el) => el.id) as SelectFieldValueType<T>);
            else onChange([value.id] as SelectFieldValueType<T>);
        } else {
            if (!value) onChange("" as SelectFieldValueType<T>);
            else if (Array.isArray(value))
                onChange(value[0].id as SelectFieldValueType<T>);
            else onChange(value.id as SelectFieldValueType<T>);
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
                orientation="vertical"
                onClick={(e) => setAnchorEl(e.currentTarget)}
            />
            <FormAutocompletePopover
                ref={ref}
                anchorEl={anchorEl}
                id={id}
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                options={options}
                onChange={handleChange}
                multiple={multiple}
                value={initialValue}
                loading={loading}
            />
        </>
    );
};

export const SelectField = forwardRef(SelectFieldComp);
