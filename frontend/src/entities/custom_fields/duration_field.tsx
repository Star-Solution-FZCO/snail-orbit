import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useState } from "react";
import FieldCard from "shared/ui/fields/field_card/field_card";
import type { FormDurationPopoverProps } from "shared/ui/fields/form_duration/form_duration";
import FormDurationPopover from "shared/ui/fields/form_duration/form_duration";
import { formatSpentTime } from "../../shared/utils";

type DurationFieldProps = {
    label: string;
    rightAdornment?: ReactNode;
} & Pick<FormDurationPopoverProps, "value" | "onChange" | "id">;

export const DurationField = forwardRef(
    (
        { value, onChange, label, id, rightAdornment }: DurationFieldProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: number) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        return (
            <>
                <FieldCard
                    label={label}
                    value={value ? formatSpentTime(value) : "?"}
                    rightAdornment={rightAdornment}
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    data-field-card-id={id}
                />
                <FormDurationPopover
                    ref={ref}
                    anchorEl={anchorEl}
                    id={id}
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    onChange={handleChange}
                    value={value}
                />
            </>
        );
    },
);
