import { Tooltip } from "@mui/material";
import { FieldChip } from "components/fields/field_chip/field_chip";
import FormInputPopover, {
    FormInputPopoverProps,
} from "components/fields/form_input/form_input";
import { ForwardedRef, forwardRef, useState } from "react";

type InputChipProps = {
    label: string;
} & Pick<FormInputPopoverProps, "value" | "onChange" | "id" | "inputMode">;

export const InputChip = forwardRef(
    (
        { value, onChange, label, id, inputMode }: InputChipProps,
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
