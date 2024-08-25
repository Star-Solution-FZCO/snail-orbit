import { ClickAwayListener } from "@mui/material";
import { ComponentRef, ForwardedRef, forwardRef, Ref } from "react";
import FieldPopper, { defaultModifiers } from "../field_popper/field_popper";
import FormAutocompleteContent, {
    FormAutocompleteContentProps,
} from "./form_autocomplete_content";

export type FormAutocompleteProps<
    F extends boolean | undefined,
    G extends boolean | undefined,
> = {
    onClose?: () => unknown;
    anchorEl: HTMLElement | null;
    id: string;
    open: boolean;
} & FormAutocompleteContentProps<F, G>;

const FormAutocompletePopoverComp = <
    F extends boolean | undefined,
    G extends boolean | undefined,
>(
    { onClose, anchorEl, id, open, ...props }: FormAutocompleteProps<F, G>,
    ref: ForwardedRef<unknown>,
) => {
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
                    <FormAutocompleteContent<F, G>
                        ref={ref}
                        onClose={handleClose}
                        {...props}
                    />
                </div>
            </ClickAwayListener>
        </FieldPopper>
    );
};

export const FormAutocompletePopover = forwardRef(
    FormAutocompletePopoverComp,
) as <F extends boolean | undefined, G extends boolean | undefined>(
    props: FormAutocompleteProps<F, G> & {
        ref?: Ref<ComponentRef<typeof FormAutocompletePopoverComp>>;
    },
) => ReturnType<typeof FormAutocompletePopoverComp>;

export default FormAutocompletePopover;
