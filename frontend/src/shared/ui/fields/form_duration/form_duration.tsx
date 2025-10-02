import { Button, ClickAwayListener, Stack } from "@mui/material";
import type { ForwardedRef, SyntheticEvent } from "react";
import { forwardRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SpentTimeField } from "shared/ui/spent_time_field";
import FieldPopper, { defaultModifiers } from "../field_popper/field_popper";
import { StyledContainer } from "./form_duration.styles";

export type FormDurationPopoverProps = {
    onClose?: () => unknown;
    anchorEl: HTMLElement | null;
    id: string;
    open: boolean;
    value?: number;
    onChange?: (value: number) => unknown;
};

export const FormDurationPopover = forwardRef(
    (
        {
            onClose,
            anchorEl,
            id,
            open,
            value,
            onChange,
        }: FormDurationPopoverProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const { t } = useTranslation();
        const [innerValue, setInnerValue] = useState<number>(0);

        useEffect(() => {
            if (open) setInnerValue(0);
        }, [open]);

        const handleClose = () => {
            if (onClose) onClose();
        };

        const handleSubmit = (e: SyntheticEvent) => {
            e.preventDefault();
            if (onChange) onChange(innerValue);
        };

        const handleAdd = (e: SyntheticEvent) => {
            e.preventDefault();
            if (onChange) onChange(innerValue + (value || 0));
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
                        <SpentTimeField
                            onChange={setInnerValue}
                            initialValue={innerValue}
                        />
                        <Stack direction="row" gap={1} justifyContent="center">
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                            >
                                {t("set")}
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={handleAdd}
                            >
                                {t("add")}
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={handleClose}
                            >
                                {t("cancel")}
                            </Button>
                        </Stack>
                    </StyledContainer>
                </ClickAwayListener>
            </FieldPopper>
        );
    },
);

export default FormDurationPopover;
