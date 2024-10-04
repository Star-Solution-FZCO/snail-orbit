import { FC, forwardRef } from "react";
import { customFieldsApi } from "store";
import { EnumOptionT } from "types";
import { useListQueryParams } from "utils";
import { SelectField } from "./select_field";
import { enumToSelectOption } from "./utils";

type EnumFieldProps = {
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    label: string;
    enumFieldId: string;
    multiple?: boolean;
};

export const EnumField: FC<EnumFieldProps> = forwardRef(
    ({ value, onChange, label, enumFieldId, multiple }, ref) => {
        const [listQueryParams] = useListQueryParams({
            limit: 50,
        });

        const [fetchOptions, { data, isLoading }] =
            customFieldsApi.useLazyListSelectOptionsQuery();

        const handleOpened = () => {
            fetchOptions({ id: enumFieldId, ...listQueryParams });
        };

        return (
            <SelectField
                loading={isLoading}
                options={enumToSelectOption(
                    (data?.payload.items as EnumOptionT[]) || [],
                )}
                value={value || ""}
                onChange={(value) => onChange(value as string)}
                label={label}
                onOpened={handleOpened}
                ref={ref}
                id={enumFieldId}
                multiple={multiple}
            />
        );
    },
);
