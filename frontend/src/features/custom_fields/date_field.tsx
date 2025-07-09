import type { Dayjs } from "dayjs";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useState } from "react";
import FieldCard from "shared/ui/fields/field_card/field_card";
import type { FormDatePopoverProps } from "shared/ui/fields/form_date/form_date";
import FormDatePopover from "shared/ui/fields/form_date/form_date";

type DateFieldProps = {
    label: string;
    rightAdornment?: ReactNode;
    error?: string;
} & Pick<FormDatePopoverProps, "value" | "onChange" | "id" | "type">;

export const DateField = forwardRef(
    (
        {
            value,
            onChange,
            label,
            id,
            type,
            rightAdornment,
            error,
        }: DateFieldProps,
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
                    variant={error ? "error" : "standard"}
                    description={error}
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
