import { FC, useMemo } from "react";
import { customFieldsApi } from "store";
import { VersionFieldT, VersionOptionT } from "types";
import { noLimitListQueryParams } from "utils";
import { SelectField } from "./select_field";
import {
    VersionSelectOptionT,
    versionFieldToSelectOption,
    versionFieldToSelectOptions,
    versionOptionToSelectOption,
} from "./utils";

type VersionFieldProps = {
    value?: VersionFieldT | VersionFieldT[];
    onChange: (value: VersionFieldT | VersionFieldT[]) => void;
    label: string;
    fieldId: string;
    multiple?: boolean;
};

export const VersionField: FC<VersionFieldProps> = ({
    value,
    onChange,
    label,
    fieldId,
    multiple,
}) => {
    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id: fieldId, ...noLimitListQueryParams });
    };

    const options = useMemo(() => {
        const items = (data?.payload.items || []) as VersionOptionT[];
        return items.map(versionOptionToSelectOption);
    }, [data?.payload.items]);

    const parsedValue = useMemo(() => {
        if (!value) return value;
        return Array.isArray(value)
            ? versionFieldToSelectOptions(value)
            : versionFieldToSelectOption(value);
    }, [value]);

    const handleChange = (
        value: VersionSelectOptionT | VersionSelectOptionT[],
    ) => {
        if (Array.isArray(value)) onChange(value.map((el) => el.original));
        else onChange(value.original);
    };

    return (
        <SelectField
            loading={isLoading}
            options={options}
            value={parsedValue}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={fieldId}
            multiple={multiple}
        />
    );
};
