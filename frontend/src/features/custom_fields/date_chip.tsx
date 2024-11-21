import { Tooltip } from "@mui/material";
import { FieldChip } from "components/fields/field_chip/field_chip";
import FormDatePopover, {
    FormDatePopoverProps,
} from "components/fields/form_date/form_date";
import { Dayjs } from "dayjs";
import { ForwardedRef, forwardRef, useMemo, useState } from "react";

type DateChipProps = {
    label: string;
} & Pick<FormDatePopoverProps, "value" | "onChange" | "id" | "type">;

export const DateChip = forwardRef(
    (
        { value, onChange, label, id, type }: DateChipProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleChange = (value: Dayjs) => {
            onChange?.(value);
            setAnchorEl(null);
        };

        const formatedValue = useMemo(
            () =>
                value?.format(
                    type === "date" ? "DD MMM YYYY" : "DD MMM YYYY HH:mm",
                ) || "?",
            [value],
        );

        return (
            <>
                <Tooltip
                    arrow
                    title={`${label}: ${formatedValue}`}
                    enterDelay={1000}
                >
                    <FieldChip onClick={(e) => setAnchorEl(e.currentTarget)}>
                        {formatedValue}
                    </FieldChip>
                </Tooltip>
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
