import type { FC, SyntheticEvent } from "react";
import { useMemo, useState } from "react";
import { customFieldsApi } from "shared/model";
import type { CustomFieldOptionNoUserT } from "shared/model/types";
import type { ColorAdornmentProps } from "shared/ui/fields/adornments/color_adornment";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { SelectChip } from "shared/ui/fields/select_chip";
import { cardLabelGetter } from "shared/ui/fields/utils";
import { useListQueryParams } from "shared/utils";
import { getCustomFieldOptionLabel, getOptionColorAdornment } from "./utils";

type EnumChipProps = {
    value?: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[];
    onChange: (
        value: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[],
    ) => void;
    label: string;
    id: string;
    multiple?: boolean;
    size?: ColorAdornmentProps["size"];
    addEmptyOption?: boolean;
};

export const EnumChip: FC<EnumChipProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    size,
    addEmptyOption,
}) => {
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });
    const [wasOpened, setWasOpened] = useState(false);

    const { data, isLoading } = customFieldsApi.useListSelectOptionsQuery(
        { id, ...listQueryParams },
        { skip: !wasOpened },
    );

    const handleOpened = () => {
        setWasOpened(true);
    };

    const items = useMemo(() => {
        if (!data?.payload.items) return [];

        const res = [...data.payload.items] as CustomFieldOptionNoUserT[];

        if (addEmptyOption)
            // @ts-expect-error TODO: Ask kbelov to add null as value type
            res.unshift({ uuid: "EMPTY", value: null, is_archived: false });

        return res;
    }, [addEmptyOption, data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent<Element, Event>,
        value: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[] | null,
    ) => {
        if (!value) return;
        onChange(value);
    };

    const adornment = useMemo(() => {
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if ("color" in targetValue && targetValue.color)
            return <ColorAdornment color={targetValue.color} size={size} />;
    }, [size, value]);

    return (
        <SelectChip<CustomFieldOptionNoUserT, typeof multiple, undefined>
            loading={isLoading}
            options={items}
            value={value}
            leftAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionRightAdornment={getOptionColorAdornment}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getOptionLabel={getCustomFieldOptionLabel}
            getCardLabelString={(value) =>
                cardLabelGetter(value, getCustomFieldOptionLabel)
            }
        />
    );
};
