import type { FC, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { OwnedFieldValueT, OwnedOptionT } from "shared/model/types";
import {
    ColorAdornment,
    type ColorAdornmentProps,
} from "shared/ui/fields/adornments/color_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectChip } from "./select_chip";
import { cardLabelGetter, getOwnedColorAdornment } from "./utils";

type OwnedChipProps = {
    value?: OwnedFieldValueT | OwnedFieldValueT[];
    onChange: (value: OwnedFieldValueT | OwnedFieldValueT[]) => void;
    label: string;
    id: string;
    multiple?: boolean;
    size?: ColorAdornmentProps["size"];
};

export const OwnedChip: FC<OwnedChipProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    size,
}) => {
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id, ...listQueryParams });
    };

    const items = useMemo(() => {
        return ((data?.payload.items || []) as unknown as OwnedOptionT[]).map(
            (el) => ({ ...el, id: el.uuid }),
        );
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent<Element, Event>,
        value: OwnedFieldValueT | OwnedFieldValueT[] | null,
    ) => {
        if (!value) return;
        onChange(value);
    };

    const adornment = useMemo(() => {
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue.color)
            return <ColorAdornment color={targetValue.color} size={size} />;
    }, [value, size]);

    return (
        <SelectChip<OwnedFieldValueT, typeof multiple, undefined>
            loading={isLoading}
            options={items}
            value={value}
            leftAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionRightAdornment={getOwnedColorAdornment}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getOptionLabel={(el) => el.value}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.value)
            }
        />
    );
};
