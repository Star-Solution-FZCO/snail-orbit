import type { InputBaseProps } from "@mui/material";
import { Button, ClickAwayListener, Stack } from "@mui/material";
import type { ForwardedRef, SyntheticEvent } from "react";
import { forwardRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FieldPopper, { defaultModifiers } from "../field_popper/field_popper";
import { StyledContainer, StyledInput } from "./form_input.styles";

export type FormInputPopoverProps = {
    onClose?: () => unknown;
    anchorEl: HTMLElement | null;
    id: string;
    open: boolean;
    value?: string;
    onChange?: (value: string) => unknown;
} & Omit<InputBaseProps, "value" | "onChange" | "type">;

export const FormInputPopover = forwardRef(
    (
        {
            onClose,
            anchorEl,
            id,
            open,
            value,
            onChange,
            inputMode,
            ...rest
        }: FormInputPopoverProps,
        ref: ForwardedRef<HTMLDivElement>,
    ) => {
        const { t } = useTranslation();

        const [innerValue, setInnerValue] = useState<string>(value || "");

        const handleClose = () => {
            if (onClose) onClose();
        };

        const isSubmitDisabled = useMemo(() => {
            if (inputMode === "numeric") {
                return !/^-?[0-9]+$/.test(innerValue);
            }
            if (inputMode === "decimal") {
                return !/^-?\d*\.?\d+$/.test(innerValue);
            }
            return false;
        }, [innerValue, inputMode]);

        const handleSubmit = (e: SyntheticEvent) => {
            e.preventDefault();
            if (!isSubmitDisabled) onChange?.(innerValue);
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
                        <StyledInput
                            autoFocus
                            inputMode={inputMode}
                            {...rest}
                            onChange={(e) => setInnerValue(e.target.value)}
                            value={innerValue}
                        />
                        <Stack direction="row" gap={1} justifyContent="center">
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
                            >
                                {t("submit")}
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

export default FormInputPopover;
