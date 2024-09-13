import { ForwardedRef, forwardRef, useEffect, useMemo } from "react";
import { customFieldsApi } from "store";
import { UserOptionT } from "types";
import { useListQueryParams } from "utils";
import { SelectField } from "./select_field";
import { enumToSelectOption } from "./utils";

type UserFieldValueType<T extends boolean | undefined> = T extends true
    ? string[]
    : string;

type UserFieldProps<T extends boolean | undefined> = {
    value: UserFieldValueType<T>;
    onChange: (value: UserFieldValueType<T>) => void;
    label: string;
    multiple?: T;
    id: string;
};

const UserFieldComp = <T extends boolean | undefined>(
    { value, onChange, label, multiple, id }: UserFieldProps<T>,
    ref: ForwardedRef<unknown>,
) => {
    const [listQueryParams] = useListQueryParams({
        limit: 50,
    });
    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    // TODO: Fix this crap
    const cardValue = useMemo(() => {
        if (!value || !data) return "";
        if (!multiple) {
            let res = data.payload.items.find(
                (el) => "id" in el && el.id === value,
            );
            console.log(res, value);
            if (res && "name" in res) return res.name;
            else return "";
        } else {
            return data.payload.items
                .filter((el) => "id" in el && value.includes(el.id))
                .map((el) => (el as UserOptionT).name)
                .join(", ");
        }
    }, [value, data]);

    const handleOpened = () => {
        fetchOptions({ id, ...listQueryParams });
    };

    useEffect(() => {
        handleOpened();
    }, []);

    return (
        <SelectField
            loading={isLoading}
            options={enumToSelectOption(data?.payload.items || [])}
            value={value}
            cardValue={cardValue || "?"}
            onChange={(value) => onChange(value as UserFieldValueType<T>)}
            label={label}
            onOpened={handleOpened}
            ref={ref}
            multiple={multiple}
            id={id}
        />
    );
};

export const UserField = forwardRef(UserFieldComp);

export default UserField;
