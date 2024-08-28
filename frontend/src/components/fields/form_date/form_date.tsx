import { ClickAwayListener } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { ForwardedRef, forwardRef, useState } from "react";
import FieldPopper, { defaultModifiers } from "../field_popper/field_popper";
import { StyledContainer } from "./form_date.styles";
import FormDateContent from "./form_date_content";
import FormDateTimeContent from "./form_datetime_content";

export type FormDatePopoverProps = {
    onClose?: () => unknown;
    anchorEl: HTMLElement | null;
    id: string;
    open: boolean;
    value?: Dayjs;
    onChange?: (value: Dayjs) => unknown;
    type?: "date" | "datetime";
};

export const FormDatePopover = forwardRef(
    (
        {
            onClose,
            anchorEl,
            id,
            open,
            value,
            onChange,
            type = "date",
        }: FormDatePopoverProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const [innerValue, setInnerValue] = useState<Dayjs | null>(
            value || null,
        );

        const handleClose = () => {
            if (onClose) onClose();
        };

        const handleChange = (val: Dayjs | null, shouldSubmit: boolean) => {
            setInnerValue(val);
            if (shouldSubmit && val) onChange?.(val);
        };

        const handleSubmit = () => {
            if (innerValue && innerValue.isValid()) onChange?.(innerValue);
        };

        return (
            <FieldPopper
                id={id}
                ref={ref}
                open={open}
                anchorEl={anchorEl}
                placement="bottom"
                modifiers={[defaultModifiers.preventOverflow]}
            >
                <ClickAwayListener onClickAway={handleClose}>
                    <StyledContainer onSubmit={handleSubmit}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            {type === "date" ? (
                                <FormDateContent
                                    value={innerValue}
                                    onChange={handleChange}
                                />
                            ) : (
                                <FormDateTimeContent
                                    value={innerValue}
                                    onChange={handleChange}
                                />
                            )}
                        </LocalizationProvider>
                    </StyledContainer>
                </ClickAwayListener>
            </FieldPopper>
        );
    },
);

export default FormDatePopover;
