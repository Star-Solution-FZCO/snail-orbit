import FieldCard from "components/fields/field_card/field_card";
import FormInputPopover, {
    FormInputPopoverProps,
} from "components/fields/form_input/form_input";
import { ForwardedRef, forwardRef, useState } from "react";

type InputFieldProps = {
    label: string;
} & Pick<FormInputPopoverProps, "value" | "onChange" | "id" | "inputMode">;

export const InputField = forwardRef(
    (
        { value, onChange, label, id, inputMode }: InputFieldProps,
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
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
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
