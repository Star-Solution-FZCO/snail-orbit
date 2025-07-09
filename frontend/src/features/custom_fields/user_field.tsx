import type { ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { BasicUserT } from "shared/model/types";
import { AvatarAdornment } from "shared/ui/fields/adornments/avatar_adornment";
import { useListQueryParams } from "shared/utils";
import { SelectField } from "./select_field";
import { cardLabelGetter, getUserAvatarAdornment } from "./utils";

type UserFieldProps = {
    value?: BasicUserT | BasicUserT[];
    onChange: (value: BasicUserT | BasicUserT[]) => void;
    label: string;
    multiple?: boolean;
    id: string;
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
}: UserFieldProps) => {
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
            loading={isLoading}
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
