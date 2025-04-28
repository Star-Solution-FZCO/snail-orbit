import { Stack } from "@mui/material";
import {
    DateCalendar,
    DateCalendarProps,
    DateField,
    DateFieldProps,
} from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { ForwardedRef, forwardRef } from "react";

export type FormDateContentProps = {
    fieldProps?: Omit<DateFieldProps<Dayjs>, "value" | "onChange">;
    calendarProps?: Omit<DateCalendarProps<Dayjs>, "value" | "onChange">;
    onChange?: (value: Dayjs | null, shouldSubmit: boolean) => unknown;
} & Pick<DateFieldProps<Dayjs>, "value">;

export const FormDateContent = forwardRef(
    (
        { value, onChange, fieldProps, calendarProps }: FormDateContentProps,
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
                <DateCalendar
                    {...calendarProps}
                    value={value}
                    onChange={(val) => onChange?.(val, true)}
                />
            </Stack>
        );
    },
);

export default FormDateContent;
