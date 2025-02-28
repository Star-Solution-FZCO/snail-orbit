import { ColorAdornment } from "components/fields/adornments/color_adornment";
import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "store";
import type { EnumFieldT } from "types";
import { useListQueryParams } from "utils";
import { SelectField } from "./select_field";
import { cardLabelGetter, getEnumColorAdornment } from "./utils";

type EnumFieldProps = {
    value?: EnumFieldT | EnumFieldT[];
    onChange: (value: EnumFieldT | EnumFieldT[]) => void;
    label: string;
    id: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
};

export const EnumField: FC<EnumFieldProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    rightAdornment,
}) => {
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });

    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id: id, ...listQueryParams });
    };

    const items = useMemo(() => {
        return (data?.payload.items || []) as EnumFieldT[];
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: EnumFieldT | EnumFieldT[] | null,
    ) => {
        if (!value) return undefined;
        onChange?.(value);
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

    return (
        <SelectField
            loading={isLoading}
            options={items}
            value={value}
            rightAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionRightAdornment={getEnumColorAdornment}
            getOptionLabel={(el) => el.value}
            getOptionKey={(el) => el.value}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.value)
            }
        />
    );
};
