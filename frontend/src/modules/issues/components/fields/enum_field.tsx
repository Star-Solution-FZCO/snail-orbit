import { FC, useMemo } from "react";
import { customFieldsApi } from "store";
import { EnumFieldT } from "types";
import { useListQueryParams } from "utils";
import { ColorAdornment } from "../../../../components/fields/form_autocomplete/color_adornment";
import { SelectField } from "./select_field";
import {
    enumToSelectOption,
    enumToSelectOptions,
    SelectFieldOptionTypeWithOriginal,
} from "./utils";

type EnumFieldProps = {
    value?: EnumFieldT | EnumFieldT[];
    onChange: (value: EnumFieldT | EnumFieldT[]) => void;
    label: string;
    enumFieldId: string;
    multiple?: boolean;
};

export const EnumField: FC<EnumFieldProps> = ({
    value,
    onChange,
    label,
    enumFieldId,
    multiple,
}) => {
    const [listQueryParams] = useListQueryParams({
        limit: 50,
    });

    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id: enumFieldId, ...listQueryParams });
    };

    const items = useMemo(() => {
        return (data?.payload.items || []) as EnumFieldT[];
    }, [data?.payload.items]);

    const parsedValue = useMemo(() => {
        if (!value) return value;
        return Array.isArray(value)
            ? enumToSelectOptions(value)
            : enumToSelectOption(value);
    }, [value]);

    const handleChange = (
        value:
            | SelectFieldOptionTypeWithOriginal
            | SelectFieldOptionTypeWithOriginal[],
    ) => {
        if (Array.isArray(value)) onChange(value.map((el) => el.original));
        else onChange(value.original);
    };

    const adornment = useMemo(() => {
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue.color)
            return <ColorAdornment color={targetValue.color} />;
    }, [value]);

    return (
        <SelectField
            loading={isLoading}
            options={enumToSelectOptions(items)}
            value={parsedValue}
            rightAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={enumFieldId}
            multiple={multiple}
        />
    );
};
