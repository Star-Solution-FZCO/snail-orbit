import { Tooltip } from "@mui/material";
import type { ForwardedRef } from "react";
import { forwardRef, useState } from "react";
import { FieldChip } from "shared/ui/fields/field_chip/field_chip";
import type { FormInputPopoverProps } from "shared/ui/fields/form_input/form_input";
import FormInputPopover from "shared/ui/fields/form_input/form_input";

type DurationChipProps = {
    label: string;
} & Pick<FormInputPopoverProps, "value" | "onChange" | "id" | "inputMode">;

export const DurationChip = forwardRef(
    (
        { value, onChange, label, id, inputMode }: DurationChipProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: string) => {
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
                <FormInputPopover
                    ref={ref}
                    anchorEl={anchorEl}
                    id={id}
                    open={!!anchorEl}
                    onClose={() => setAnchorEl(null)}
                    onChange={handleChange}
                    value={value}
                    inputMode={inputMode}
                />
            </>
        );
    },
);
