import { Tooltip } from "@mui/material";
import type { ForwardedRef } from "react";
import { forwardRef, useState } from "react";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";
import type { FormDurationPopoverProps } from "shared/ui/fields/form_duration/form_duration";
import FormDurationPopover from "shared/ui/fields/form_duration/form_duration";

type DurationChipProps = {
    label: string;
} & Pick<FormDurationPopoverProps, "value" | "onChange" | "id">;

export const DurationChip = forwardRef(
    (
        { value, onChange, label, id }: DurationChipProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: number) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        return (
            <>
                <Tooltip arrow title={`${label}: ${value}`} enterDelay={1000}>
                    <FieldChip onClick={(e) => setAnchorEl(e.currentTarget)}>
                        {value}
                    </FieldChip>
                </Tooltip>
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
