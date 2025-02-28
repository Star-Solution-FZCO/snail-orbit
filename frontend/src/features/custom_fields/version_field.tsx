import type { FC, ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
import { customFieldsApi } from "store";
import type { VersionFieldT, VersionOptionT } from "types";
import { noLimitListQueryParams } from "utils";
import { SelectField } from "./select_field";
import {
    cardLabelGetter,
    getVersionFieldLabel,
    versionOptionToField,
} from "./utils";

type VersionFieldProps = {
    value?: VersionFieldT | VersionFieldT[];
    onChange: (value: VersionFieldT | VersionFieldT[]) => void;
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
        value: VersionFieldT | VersionFieldT[] | null,
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
