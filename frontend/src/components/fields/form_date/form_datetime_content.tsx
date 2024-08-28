import { Stack } from "@mui/material";
import {
    DateTimeField,
    DateTimeFieldProps,
    StaticDateTimePicker,
    StaticDateTimePickerProps,
} from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { ForwardedRef, forwardRef } from "react";

export type FormDateTimeContentProps = {
    fieldProps?: Omit<DateTimeFieldProps<Dayjs>, "value" | "onChange">;
    calendarProps?: Omit<
        StaticDateTimePickerProps<Dayjs>,
        "value" | "onChange"
    >;
    onChange?: (value: Dayjs | null, shouldSubmit: boolean) => unknown;
} & Pick<DateTimeFieldProps<Dayjs>, "value">;

export const FormDateTimeContent = forwardRef(
    (
        {
            value,
            onChange,
            fieldProps,
            calendarProps,
        }: FormDateTimeContentProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        return (
            <Stack direction="column" gap={1}>
                <DateTimeField
                    size="small"
                    autoFocus
                    ref={ref}
                    format="DD-MM-YYYY HH:mm"
                    {...fieldProps}
                    value={value}
                    onChange={(val) => onChange?.(val, false)}
                />
                <StaticDateTimePicker
                    {...calendarProps}
                    value={value}
                    onChange={(val) => onChange?.(val, false)}
                    onAccept={(val) => onChange?.(val, true)}
                    sx={{ backgroundColor: "inherit" }}
                />
            </Stack>
        );
    },
);

export default FormDateTimeContent;
