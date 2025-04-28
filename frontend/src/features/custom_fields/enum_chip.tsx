import type { FC, SyntheticEvent } from "react";
import { useMemo } from "react";
import type { EnumFieldT } from "shared/model/types";
import { customFieldsApi } from "shared/model";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectChip } from "./select_chip";
import { cardLabelGetter, getEnumColorAdornment } from "./utils";

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
        return (data?.payload.items || []) as unknown as EnumFieldT[];
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent<Element, Event>,
        value: EnumFieldT | EnumFieldT[] | null,
    ) => {
        if (!value) return;
        onChange(value);
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
            options={items}
            value={value}
            leftAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={enumFieldId}
            multiple={multiple}
            getOptionRightAdornment={getEnumColorAdornment}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getOptionLabel={(el) => el.value}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.value)
            }
        />
    );
};
