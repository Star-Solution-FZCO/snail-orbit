import FieldCard from "components/fields/field_card/field_card";
import { Dayjs } from "dayjs";
import { ForwardedRef, forwardRef, useState } from "react";
import FormDatePopover, {
    FormDatePopoverProps,
} from "../../../../components/fields/form_date/form_date";

type InputFieldProps = {
    label: string;
} & Pick<FormDatePopoverProps, "value" | "onChange" | "id" | "type">;

export const DateField = forwardRef(
    (
        { value, onChange, label, id, type }: InputFieldProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: Dayjs) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        console.log(label, value);

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
                    orientation="vertical"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
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
