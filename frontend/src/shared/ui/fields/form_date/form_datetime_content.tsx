import { Stack } from "@mui/material";
import type {
    DateTimeFieldProps,
    StaticDateTimePickerProps,
} from "@mui/x-date-pickers";
import { DateTimeField, StaticDateTimePicker } from "@mui/x-date-pickers";
import type { Dayjs } from "dayjs";
import type { ForwardedRef } from "react";
import { forwardRef } from "react";

export type FormDateTimeContentProps = {
    fieldProps?: Omit<DateTimeFieldProps<Dayjs>, "value" | "onChange">;
    calendarProps?: Omit<
        StaticDateTimePickerProps<Dayjs>,
        "value" | "onChange"
    >;
    onChange?: (value: Dayjs | null, shouldSubmit: boolean) => unknown;
    clearable?: boolean;
} & Pick<DateTimeFieldProps<Dayjs>, "value">;

export const FormDateTimeContent = forwardRef(
    (
        {
            value,
            onChange,
            fieldProps,
            calendarProps,
            clearable,
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
                    displayStaticWrapperAs="desktop"
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

export default FormDateTimeContent;
