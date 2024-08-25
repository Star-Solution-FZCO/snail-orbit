import { ForwardedRef, forwardRef, useMemo } from "react";
import { userApi } from "../../../../store";
import { SelectField, SelectFieldOptionType } from "./select_field";

type UserFieldValueType<T extends boolean | undefined> = T extends true
    ? string[]
    : string;

type UserFieldProps<T extends boolean | undefined> = {
    value: UserFieldValueType<T>;
    onChange: (value: UserFieldValueType<T>) => void;
    label: string;
    multiple?: T;
};

const UserFieldComp = <T extends boolean | undefined>(
    { value, onChange, label, multiple }: UserFieldProps<T>,
    ref: ForwardedRef<unknown>,
) => {
    const [fetch, { data, isLoading }] = userApi.useLazyListUserQuery();

    const options: SelectFieldOptionType[] = useMemo(() => {
        if (!data) return [];
        return data.payload.items.map(({ id, name, email }) => ({
            label: name,
            description: email,
            id: id,
        }));
    }, [data]);

    // Ужасное решение, но RTK не дает запрашивать массив хуков, поэтому пока так
    const cardValue = useMemo(() => {
        if (!value) return "";
        if (!multiple) return options.find((el) => el.id === value)?.label;
        else
            return options
                .filter((el) => value.includes(el.id))
                .map((el) => el.label)
                .join(", ");
    }, [value, options]);

    return (
        <SelectField
            loading={isLoading}
            options={options}
            value={value}
            cardValue={cardValue || "?"}
            onChange={(value) => onChange(value as UserFieldValueType<T>)}
            label={label}
            onOpened={fetch}
            ref={ref}
            multiple={multiple}
            id="projects"
        />
    );
};

export const UserField = forwardRef(UserFieldComp);

export default UserField;
