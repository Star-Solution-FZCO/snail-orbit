import { Stack } from "@mui/material";
import type {
    DateFieldProps,
    StaticDatePickerProps,
} from "@mui/x-date-pickers";
import { DateField, StaticDatePicker } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";
import type { ForwardedRef } from "react";
import { forwardRef } from "react";

export type FormDateContentProps = {
    fieldProps?: Omit<DateFieldProps<Dayjs>, "value" | "onChange">;
    calendarProps?: Omit<StaticDatePickerProps<Dayjs>, "value" | "onChange">;
    onChange?: (value: Dayjs | null, shouldSubmit: boolean) => unknown;
    clearable?: boolean;
} & Pick<DateFieldProps<Dayjs>, "value">;

export const FormDateContent = forwardRef(
    (
        {
            value,
            onChange,
            fieldProps,
            calendarProps,
            clearable,
        }: FormDateContentProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        return (
            <Stack direction="column" gap={1}>
                <DateField
                    size="small"
                    autoFocus
                    ref={ref}
                    format="DD-MM-YYYY"
                    {...fieldProps}
                    value={value}
                    onChange={(val) => onChange?.(val, false)}
                />
                <StaticDatePicker
                    {...calendarProps}
                    value={value}
                    onChange={(val) => onChange?.(val, true)}
                    sx={{ backgroundColor: "inherit" }}
                    slotProps={{
                        actionBar: {
                            actions: clearable ? ["clear", "accept"] : [],
                            onClear: () => onChange?.(null, true),
                        },
                    }}
                />
            </Stack>
        );
    },
);

export default FormDateContent;
