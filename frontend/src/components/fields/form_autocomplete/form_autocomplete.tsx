import { ClickAwayListener } from "@mui/material";
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

export const FormAutocompletePopover = <
    F extends boolean | undefined,
    G extends boolean | undefined,
>({
    onClose,
    anchorEl,
    id,
    open,
    ...props
}: FormAutocompleteProps<F, G>) => {
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
                        onClose={handleClose}
                        {...props}
                    />
                </div>
            </ClickAwayListener>
        </FieldPopper>
    );
};
