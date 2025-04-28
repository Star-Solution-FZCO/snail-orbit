import { ClickAwayListener } from "@mui/material";
import FieldPopper, { defaultModifiers } from "../field_popper/field_popper";
import type { FormAutocompleteContentProps } from "./form_autocomplete_content";
import FormAutocompleteContent from "./form_autocomplete_content";

export type FormAutocompletePopoverProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
> = {
    onClose?: () => unknown;
    anchorEl?: Element | null;
    id: string;
    open: boolean;
} & FormAutocompleteContentProps<Value, Multiple, DisableClearable>;

export const FormAutocompletePopover = <
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
>({
    onClose,
    anchorEl,
    id,
    open,
    ...props
}: FormAutocompletePopoverProps<Value, Multiple, DisableClearable>) => {
    const handleClose = () => {
        if (onClose) onClose();
    };

    return (
        <FieldPopper
            id={id}
            open={open}
            anchorEl={anchorEl}
            placement="bottom"
            modifiers={[defaultModifiers.preventOverflow]}
        >
            <ClickAwayListener onClickAway={handleClose}>
                <div>
                    <FormAutocompleteContent<Value, Multiple, DisableClearable>
                        onClose={handleClose}
                        {...props}
                    />
                </div>
            </ClickAwayListener>
        </FieldPopper>
    );
};
