import { Button } from "@mui/material";
import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type { CustomFieldOptionNoUserT } from "shared/model/types";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { SelectField } from "shared/ui/fields/select_field";
import { cardLabelGetter } from "shared/ui/fields/utils";
import { useListQueryParams } from "shared/utils";
import { getCustomFieldOptionLabel, getOptionColorAdornment } from "./utils";

type EnumFieldProps = {
    value?: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[];
    onChange: (
        value: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[],
    ) => void;
    label: string;
    id: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
    error?: string;
    clearable?: boolean;
};

const emptyValue: CustomFieldOptionNoUserT = {
    uuid: "EMPTY",
    // @ts-expect-error known problem fix sometime
    value: null,
    is_archived: false,
};

const arrayEmptyValue: CustomFieldOptionNoUserT[] = [];

export const EnumField: FC<EnumFieldProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    rightAdornment,
    error,
    clearable,
}) => {
    const { t } = useTranslation();

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

        return data.payload.items as CustomFieldOptionNoUserT[];
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: CustomFieldOptionNoUserT | CustomFieldOptionNoUserT[] | null,
    ) => {
        if (!value) return undefined;
        onChange?.(value);
    };

    const adornment = useMemo(() => {
        if (rightAdornment) return rightAdornment;
        if (!value || (Array.isArray(value) && !value.length)) return null;
        const targetValue = Array.isArray(value) ? value[0] : value;
        if (targetValue && "color" in targetValue && targetValue.color)
            return (
                <ColorAdornment
                    color={targetValue.color}
                    size="small"
                    sx={{ my: "auto" }}
                />
            );
    }, [value, rightAdornment]);

    return (
        <SelectField<CustomFieldOptionNoUserT, typeof multiple, true>
            loading={isLoading}
            options={items}
            value={value}
            rightAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionRightAdornment={getOptionColorAdornment}
            getOptionLabel={getCustomFieldOptionLabel}
            getOptionKey={(el) => el.uuid}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getCardLabelString={(value) =>
                cardLabelGetter(value, getCustomFieldOptionLabel)
            }
            variant={error ? "error" : "standard"}
            description={error}
            bottomSlot={
                clearable ? (
                    <Button
                        size="small"
                        fullWidth
                        onClick={() =>
                            onChange?.(multiple ? arrayEmptyValue : emptyValue)
                        }
                    >
                        {t("Clear")}
                    </Button>
                ) : null
            }
        />
    );
};
