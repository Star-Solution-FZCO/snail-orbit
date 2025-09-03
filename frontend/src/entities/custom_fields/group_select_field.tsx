import { type ReactNode, type SyntheticEvent, useMemo, useState } from "react";
import { customFieldsApi } from "shared/model";
import type { EnumOptionT } from "shared/model/types";
import type { ShortOptionOutput } from "shared/model/types/backend-schema.gen";
import { ColorAdornment } from "shared/ui/fields/adornments/color_adornment";
import { SelectField } from "shared/ui/fields/select_field";
import { cardLabelGetter } from "shared/ui/fields/utils";
import { useListQueryParams } from "shared/utils";
import { getOptionColorAdornment } from "./utils";

type GroupSelectFieldProps = {
    value?: ShortOptionOutput | ShortOptionOutput[];
    onChange: (value: ShortOptionOutput | ShortOptionOutput[]) => void;
    label: string;
    gid: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
    error?: string;
};

export const GroupSelectField = (props: GroupSelectFieldProps) => {
    const { gid, label, multiple, rightAdornment, error, value, onChange } =
        props;
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });
    const [wasOpened, setWasOpened] = useState(false);

    const { data, isLoading } = customFieldsApi.useListGroupSelectOptionsQuery(
        { gid: gid, ...listQueryParams },
        { skip: !wasOpened },
    );

    const handleOpened = () => {
        setWasOpened(true);
    };

    const items = useMemo(() => {
        return ((data?.payload.items || []) as EnumOptionT[]).map(
            ({ uuid, ...rest }) => ({ ...rest, id: uuid }),
        );
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: ShortOptionOutput | ShortOptionOutput[] | null,
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
        <SelectField<ShortOptionOutput, typeof multiple, true>
            loading={isLoading}
            options={items}
            value={value}
            rightAdornment={adornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={gid}
            multiple={multiple}
            getOptionRightAdornment={getOptionColorAdornment}
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
