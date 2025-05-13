import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "shared/model";
import type { VersionFieldValueT, VersionOptionT } from "shared/model/types";
import { noLimitListQueryParams } from "shared/utils";
import { SelectField } from "./select_field";
import {
    cardLabelGetter,
    getVersionFieldLabel,
    versionOptionToField,
} from "./utils";

type VersionFieldProps = {
    value?: VersionFieldValueT | VersionFieldValueT[];
    onChange: (value: VersionFieldValueT | VersionFieldValueT[]) => void;
    label: string;
    id: string;
    multiple?: boolean;
    rightAdornment?: ReactNode;
};

export const VersionField: FC<VersionFieldProps> = ({
    value,
    onChange,
    label,
    id,
    multiple,
    rightAdornment,
}) => {
    const [fetchOptions, { data, isLoading }] =
        customFieldsApi.useLazyListSelectOptionsQuery();

    const handleOpened = () => {
        fetchOptions({ id: id, ...noLimitListQueryParams });
    };

    const options = useMemo(() => {
        return ((data?.payload.items || []) as VersionOptionT[]).map(
            versionOptionToField,
        );
    }, [data?.payload.items]);

    const handleChange = (
        _: SyntheticEvent,
        value: VersionFieldValueT | VersionFieldValueT[] | null,
    ) => {
        if (!value) return undefined;
        onChange(value);
    };

    return (
        <SelectField
            loading={isLoading}
            options={options}
            value={value}
            rightAdornment={rightAdornment}
            onChange={handleChange}
            label={label}
            onOpened={handleOpened}
            id={id}
            multiple={multiple}
            getOptionKey={(el) => el.id}
            getOptionLabel={getVersionFieldLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            getCardLabelString={(el) =>
                cardLabelGetter(el, getVersionFieldLabel)
            }
        />
    );
};
