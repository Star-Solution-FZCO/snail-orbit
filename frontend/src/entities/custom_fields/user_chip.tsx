import { type SyntheticEvent, useMemo, useState } from "react";
import { customFieldsApi, userApi } from "shared/model";
import type { BasicUserT } from "shared/model/types";
import { AvatarAdornment } from "shared/ui/fields/adornments/avatar_adornment";
import { SelectChip } from "shared/ui/fields/select_chip";
import { cardLabelGetter } from "shared/ui/fields/utils";
import { useListQueryParams } from "shared/utils";
import { getUserAvatarAdornment } from "./utils";

type UserChipProps = {
    value?: BasicUserT | BasicUserT[];
    onChange: (value: BasicUserT | BasicUserT[]) => void;
    label: string;
    multiple?: boolean;
    id: string;
    type?: "field" | "group_field" | "users";
};

export const UserChip = ({
    value,
    label,
    multiple,
    id,
    onChange,
    type = "field",
}: UserChipProps) => {
    const [wasOpened, setWasOpened] = useState(false);
    const [listQueryParams] = useListQueryParams({
        limit: 0,
    });
    const { data: customFieldOptions, isLoading: isCustomFieldOptionsLoading } =
        customFieldsApi.useListSelectOptionsQuery(
            { id, ...listQueryParams },
            { skip: type !== "field" || !wasOpened },
        );
    const { data: userOptions, isLoading: isUsersOptionsLoading } =
        userApi.useListSelectUserQuery(
            { ...listQueryParams },
            { skip: type !== "users" || !wasOpened },
        );
    const {
        data: customFieldGroupOptions,
        isLoading: isCustomFieldGroupOptionsLoading,
    } = customFieldsApi.useListGroupSelectOptionsQuery(
        { gid: id, ...listQueryParams },
        { skip: type !== "group_field" || !wasOpened },
    );

    const handleOpened = () => {
        setWasOpened(true);
    };

    const options = useMemo(() => {
        return (customFieldOptions?.payload.items ||
            userOptions?.payload.items ||
            customFieldGroupOptions?.payload.items ||
            []) as BasicUserT[];
    }, [
        customFieldGroupOptions?.payload.items,
        customFieldOptions?.payload.items,
        userOptions?.payload.items,
    ]);

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
            loading={
                isCustomFieldOptionsLoading ||
                isUsersOptionsLoading ||
                isCustomFieldGroupOptionsLoading
            }
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
