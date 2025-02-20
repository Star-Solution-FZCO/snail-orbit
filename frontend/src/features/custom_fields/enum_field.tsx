import { ColorAdornment } from "components/fields/adornments/color_adornment";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "store";
import type { EnumFieldT } from "types";
import { useListQueryParams } from "utils";
import { SelectField } from "./select_field";
import type { SelectOptionTypeWithOriginal } from "./utils";
import { enumToSelectOption, enumToSelectOptions } from "./utils";

type EnumFieldProps = {
    value?: EnumFieldT | EnumFieldT[];
    onChange: (value: EnumFieldT | EnumFieldT[]) => void;
    label: string;
    enumFieldId: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
};

export const EnumField: FC<EnumFieldProps> = ({
    value,
    onChange,
    label,
    enumFieldId,
    multiple,
    rightAdornment,
}) => {
    const [listQueryParams] = useListQueryParams({
        limit: 0,
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
        value: SelectOptionTypeWithOriginal | SelectOptionTypeWithOriginal[],
    ) => {
        if (Array.isArray(value)) onChange(value.map((el) => el.original));
        else onChange(value.original);
    };

    const adornment = useMemo(() => {
        if (rightAdornment) return rightAdornment;
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue.color)
            return (
                <ColorAdornment
                    color={targetValue.color}
                    size="medium"
                    sx={{ my: "auto" }}
                />
            );
    }, [value, rightAdornment]);

    const options = useMemo(() => enumToSelectOptions(items), [items]);

    return (
        <SelectField
            loading={isLoading}
            options={options}
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
