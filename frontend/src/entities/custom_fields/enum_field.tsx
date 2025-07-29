import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { EnumFieldValueT, EnumOptionT } from "shared/model/types";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectField } from "./select_field";
import { cardLabelGetter, getEnumColorAdornment } from "./utils";

type EnumFieldProps = {
    value?: EnumFieldValueT | EnumFieldValueT[];
    onChange: (value: EnumFieldValueT | EnumFieldValueT[]) => void;
    label: string;
    id: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
    error?: string;
};

export const EnumField: FC<EnumFieldProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    rightAdornment,
    error,
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
        return ((data?.payload.items || []) as EnumOptionT[]).map(
            ({ uuid, ...rest }) => ({ ...rest, id: uuid }),
        );
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: EnumFieldValueT | EnumFieldValueT[] | null,
    ) => {
        if (!value) return undefined;
        onChange?.(value);
    };

    const adornment = useMemo(() => {
        if (rightAdornment) return rightAdornment;
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue && targetValue.color)
            return (
                <ColorAdornment
                    color={targetValue.color}
                    size="medium"
                    sx={{ my: "auto" }}
                />
            );
    }, [value, rightAdornment]);

    return (
        <SelectField<EnumFieldValueT, typeof multiple, true>
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
            variant={error ? "error" : "standard"}
            description={error}
        />
    );
};
