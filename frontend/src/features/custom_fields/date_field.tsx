import FieldCard from "components/fields/field_card/field_card";
import type { FormDatePopoverProps } from "components/fields/form_date/form_date";
import FormDatePopover from "components/fields/form_date/form_date";
import type { Dayjs } from "dayjs";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useState } from "react";

type DateFieldProps = {
    label: string;
    rightAdornment?: ReactNode;
} & Pick<FormDatePopoverProps, "value" | "onChange" | "id" | "type">;

export const DateField = forwardRef(
    (
        { value, onChange, label, id, type, rightAdornment }: DateFieldProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: Dayjs) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        return (
            <>
                <FieldCard
                    label={label}
                    value={
                        value?.format(
                            type === "date"
                                ? "DD MMM YYYY"
                                : "DD MMM YYYY HH:mm",
                        ) || "?"
                    }
                    rightAdornment={rightAdornment}
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    data-field-card-id={id}
                />
                <FormDatePopover
                    ref={ref}
                    anchorEl={anchorEl}
                    id={id}
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    onChange={handleChange}
                    value={value}
                    type={type}
                />
            </>
        );
    },
);
