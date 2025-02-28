import FieldCard from "components/fields/field_card/field_card";
import type { FormInputPopoverProps } from "components/fields/form_input/form_input";
import FormInputPopover from "components/fields/form_input/form_input";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef, useState } from "react";

type InputFieldProps = {
    label: string;
    rightAdornment?: ReactNode;
} & Pick<FormInputPopoverProps, "value" | "onChange" | "id" | "inputMode">;

export const InputField = forwardRef(
    (
        {
            value,
            onChange,
            label,
            id,
            inputMode,
            rightAdornment,
        }: InputFieldProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: string) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        return (
            <>
                <FieldCard
                    label={label}
                    value={value ?? "?"}
                    rightAdornment={rightAdornment}
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    data-field-card-id={id}
                />
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
