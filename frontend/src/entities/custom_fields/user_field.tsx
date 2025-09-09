import type { ReactNode, SyntheticEvent } from "react";
import { useMemo, useState } from "react";
import { customFieldsApi, userApi } from "shared/model";
import type { BasicUserT } from "shared/model/types";
import { AvatarAdornment } from "shared/ui/fields/adornments/avatar_adornment";
import { SelectField } from "shared/ui/fields/select_field";
import { cardLabelGetter } from "shared/ui/fields/utils";
import { useListQueryParams } from "shared/utils";
import { getUserAvatarAdornment } from "./utils";

type UserFieldProps = {
    value?: BasicUserT | BasicUserT[];
    onChange: (value: BasicUserT | BasicUserT[]) => void;
    label: string;
    multiple?: boolean;
    id: string;
    type?: "field" | "group_field" | "users";
    rightAdornment?: ReactNode;
    error?: string;
};

export const UserField = ({
    value,
    label,
    multiple,
    id,
    onChange,
    rightAdornment,
    error,
    type = "field",
}: UserFieldProps) => {
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
        _: SyntheticEvent,
        value: BasicUserT | BasicUserT[] | null,
    ) => {
        if (!value) return undefined;
        onChange(value);
    };

    const adornment = useMemo(() => {
        if (rightAdornment) return rightAdornment;
        if (!value || (Array.isArray(value) && !value.length)) return null;
        return (
            <AvatarAdornment
                src={Array.isArray(value) ? value[0].avatar : value.avatar}
                sx={{
                    mr: 1,
                    my: "auto",
                }}
            />
        );
    }, [value, rightAdornment]);

    return (
        <SelectField
            loading={
                isCustomFieldOptionsLoading ||
                isUsersOptionsLoading ||
                isCustomFieldGroupOptionsLoading
            }
            options={options}
            value={value}
            label={label}
            rightAdornment={adornment}
            onChange={handleChange}
            onOpened={handleOpened}
            multiple={multiple}
            id={id}
            getOptionRightAdornment={getUserAvatarAdornment}
            getOptionLabel={(el) => el.name}
            getOptionDescription={(el) => el.email}
            getOptionKey={(el) => el.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            getCardLabelString={(value) =>
                cardLabelGetter(value, (el) => el.name)
            }
            variant={error ? "error" : "standard"}
            description={error}
        />
    );
};

export default UserField;
