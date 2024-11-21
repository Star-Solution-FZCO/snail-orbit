import { useMemo } from "react";
import { customFieldsApi } from "store";
import { BasicUserT } from "types";
import { useListQueryParams } from "utils";
import { AvatarAdornment } from "../../components/fields/adornments/avatar_adornment";
import { SelectField } from "./select_field";
import {
    UserSelectOptionT,
    userToSelectOption,
    userToSelectOptions,
} from "./utils";

type UserFieldProps = {
    value?: BasicUserT | BasicUserT[];
    onChange: (value: BasicUserT | BasicUserT[]) => void;
    label: string;
    multiple?: boolean;
    id: string;
};

export const UserField = ({
    value,
    label,
    multiple,
    id,
    onChange,
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
        return userToSelectOptions((data?.payload.items || []) as BasicUserT[]);
    }, [data?.payload.items]);

    const parsedValue = useMemo(() => {
        if (!value) return undefined;
        if (Array.isArray(value)) return userToSelectOptions(value);
        else return userToSelectOption(value);
    }, [value]);

    const handleChange = (value: UserSelectOptionT | UserSelectOptionT[]) => {
        if (Array.isArray(value)) onChange(value.map((el) => el.original));
        else onChange(value.original);
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
            />
        );
    }, [value]);

    return (
        <SelectField
            loading={isLoading}
            options={options}
            value={parsedValue}
            label={label}
            rightAdornment={adornment}
            onChange={handleChange}
            onOpened={handleOpened}
            multiple={multiple}
            id={id}
        />
    );
};

export default UserField;
