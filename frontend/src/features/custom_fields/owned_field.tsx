import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { OwnedFieldValueT, OwnedOptionT } from "shared/model/types";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectField } from "./select_field";
import { cardLabelGetter, getOwnedColorAdornment } from "./utils";

type OwnedFieldProps = {
    value?: OwnedFieldValueT | OwnedFieldValueT[];
    onChange: (value: OwnedFieldValueT | OwnedFieldValueT[]) => void;
    label: string;
    id: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
};

export const OwnedField: FC<OwnedFieldProps> = ({
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
        return ((data?.payload.items || []) as OwnedOptionT[]).map(
            ({ uuid, ...rest }) => ({ ...rest, id: uuid }),
        );
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: OwnedFieldValueT | OwnedFieldValueT[] | null,
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
        <SelectField<OwnedFieldValueT, typeof multiple, true>
            loading={isLoading}
            options={items}
            value={value}
            rightAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionRightAdornment={getOwnedColorAdornment}
            getOptionLabel={(el) => el.value}
            getOptionKey={(el) => el.value}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.value)
            }
        />
    );
};
