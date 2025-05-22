import { type SyntheticEvent, useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { BasicUserT } from "shared/model/types";
import { AvatarAdornment } from "shared/ui/fields/adornments/avatar_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectChip } from "./select_chip";
import { cardLabelGetter, getUserAvatarAdornment } from "./utils";

type UserChipProps = {
    value?: BasicUserT | BasicUserT[];
    onChange: (value: BasicUserT | BasicUserT[]) => void;
    label: string;
    multiple?: boolean;
    id: string;
};

export const UserChip = ({
    value,
    label,
    multiple,
    id,
    onChange,
}: UserChipProps) => {
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });
    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id, ...listQueryParams });
    };

    const options = useMemo(() => {
        return (data?.payload.items || []) as BasicUserT[];
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent<Element, Event>,
        value: BasicUserT | BasicUserT[] | null,
    ) => {
        if (!value) return undefined;
        onChange(value);
    };

    const adornment = useMemo(() => {
        if (!value || (Array.isArray(value) && !value.length)) return null;
        return (
            <AvatarAdornment
                src={Array.isArray(value) ? value[0].avatar : value.avatar}
                sx={{
                    mr: 1,
                    my: "auto",
                }}
                size="small"
            />
        );
    }, [value]);

    return (
        <SelectChip
            loading={isLoading}
            options={options}
            value={value}
            label={label}
            leftAdornment={adornment}
            onChange={handleChange}
            onOpened={handleOpened}
            multiple={multiple}
            id={id}
            getOptionRightAdornment={getUserAvatarAdornment}
            getOptionLabel={(el) => el.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            getOptionDescription={(el) => el.email}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.name)
            }
        />
    );
};

export default UserChip;
