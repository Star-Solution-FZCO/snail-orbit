import {
    Autocomplete,
    AutocompleteCloseReason,
    AutocompleteProps,
    Box,
    Checkbox,
    ClickAwayListener,
    Stack,
} from "@mui/material";
import React, { ChangeEvent, ForwardedRef, forwardRef } from "react";
import FieldPopper, { defaultModifiers } from "../field_popper.tsx";
import { PopperComponent, StyledInput } from "./form_autocomplete.styles.tsx";

export type FormAutocompleteValueType = {
    label: string;
    description?: string | null;
    color?: string | null;
    [key: string]: any;
};

export type FormAutocompleteProps<
    F extends boolean | undefined,
    G extends boolean | undefined,
> = {
    onClose?: () => unknown;
    anchorEl: HTMLElement | null;
    id: string;
    open: boolean;
} & Omit<
    AutocompleteProps<FormAutocompleteValueType, F, G, false>,
    "renderOption" | "renderInput" | "renderTags" | "open" | "onClose"
>;

export const FormAutocomplete = forwardRef(
    <F extends boolean | undefined, G extends boolean | undefined>(
        {
            onClose,
            multiple,
            anchorEl,
            id,
            options,
            onChange,
            open,
            getOptionLabel,
            ...props
        }: FormAutocompleteProps<F, G>,
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
                        {/* TODO: Вытащить этот Autocomplete в отдельный компонент,
                    TODO: нет смысла ему быть сразу объедененным с Popper */}
                        <Autocomplete<FormAutocompleteValueType, F, G>
                            ref={ref}
                            open
                            multiple={multiple}
                            onClose={(
                                _: ChangeEvent<{}>,
                                reason: AutocompleteCloseReason,
                            ) => {
                                if (
                                    reason === "escape" ||
                                    reason === "selectOption"
                                ) {
                                    handleClose();
                                }
                            }}
                            onChange={(event, newValue, reason) => {
                                if (
                                    event.type === "keydown" &&
                                    ((event as React.KeyboardEvent).key ===
                                        "Backspace" ||
                                        (event as React.KeyboardEvent).key ===
                                            "Delete") &&
                                    reason === "removeOption"
                                ) {
                                    return;
                                }
                                onChange?.(event, newValue, reason);
                            }}
                            PopperComponent={PopperComponent}
                            renderTags={() => null}
                            renderOption={(props, option, { selected }) => {
                                const { key, ...optionProps } = props;
                                return (
                                    <li key={key} {...optionProps}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            sx={{ width: 1 }}
                                        >
                                            <Stack direction="row">
                                                {multiple ? (
                                                    <Checkbox
                                                        size="small"
                                                        checked={
                                                            selected || false
                                                        }
                                                    />
                                                ) : null}
                                                <Stack
                                                    direction="column"
                                                    justifyContent="center"
                                                >
                                                    {option.label}
                                                    {option.description && (
                                                        <Box
                                                            component="span"
                                                            sx={(t) => ({
                                                                color: "#8b949e",
                                                                ...t.applyStyles(
                                                                    "light",
                                                                    {
                                                                        color: "#586069",
                                                                    },
                                                                ),
                                                            })}
                                                        >
                                                            {option.description}
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Stack>
                                            {option.color ? (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        width: 18,
                                                        height: 18,
                                                        flexShrink: 0,
                                                        borderRadius: "3px",
                                                        mr: 1,
                                                        my: "auto",
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            option.color,
                                                    }}
                                                />
                                            ) : null}
                                        </Stack>
                                    </li>
                                );
                            }}
                            options={options}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                                <StyledInput
                                    ref={params.InputProps.ref}
                                    inputProps={params.inputProps}
                                    autoFocus
                                    placeholder="Filter labels"
                                />
                            )}
                            {...props}
                        />
                    </div>
                </ClickAwayListener>
            </FieldPopper>
        );
    },
);
