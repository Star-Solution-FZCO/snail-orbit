import { ColorAdornment } from "components/fields/adornments/color_adornment";
import { FC, useMemo } from "react";
import { customFieldsApi } from "store";
import { EnumFieldT } from "types";
import { useListQueryParams } from "utils";
import { SelectChip } from "./select_chip";
import {
    enumToSelectOption,
    enumToSelectOptions,
    SelectOptionTypeWithOriginal,
} from "./utils";

type EnumChipProps = {
    value?: EnumFieldT | EnumFieldT[];
    onChange: (value: EnumFieldT | EnumFieldT[]) => void;
    label: string;
    enumFieldId: string;
    multiple?: boolean;
};

export const EnumChip: FC<EnumChipProps> = ({
    value,
    onChange,
    label,
    enumFieldId,
    multiple,
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
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue.color)
            return <ColorAdornment color={targetValue.color} size="small" />;
    }, [value]);

    return (
        <SelectChip
            loading={isLoading}
            options={enumToSelectOptions(items)}
            value={parsedValue}
            leftAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={enumFieldId}
            multiple={multiple}
        />
    );
};
