import {
    Autocomplete,
    AutocompleteCloseReason,
    AutocompleteProps,
    Box,
    Checkbox,
    Stack,
} from "@mui/material";
import React, {
    ComponentRef,
    ForwardedRef,
    forwardRef,
    Ref,
    SyntheticEvent,
} from "react";
import { PopperComponent, StyledInput } from "./form_autocomplete.styles";

export type FormAutocompleteValueType = {
    label: string;
    description?: string | null;
    color?: string | null;
    [key: string]: any;
};

export type FormAutocompleteContentProps<
    F extends boolean | undefined,
    G extends boolean | undefined,
> = Omit<
    AutocompleteProps<FormAutocompleteValueType, F, G, false>,
    "renderOption" | "renderInput" | "renderTags" | "open"
>;

const FormAutocompleteContentComp = <
    F extends boolean | undefined,
    G extends boolean | undefined,
>(
    {
        multiple,
        onClose,
        onChange,
        options,
        ...props
    }: FormAutocompleteContentProps<F, G>,
    ref: ForwardedRef<unknown>,
) => {
    return (
        <Autocomplete<FormAutocompleteValueType, F, G>
            ref={ref}
            open
            multiple={multiple}
            onClose={(
                event: SyntheticEvent<Element, Event>,
                reason: AutocompleteCloseReason,
            ) => {
                if (
                    reason === "escape" ||
                    (!multiple && reason === "selectOption")
                ) {
                    onClose?.(event, reason);
                }
            }}
            onChange={(event, newValue, reason) => {
                if (
                    event.type === "keydown" &&
                    ((event as React.KeyboardEvent).key === "Backspace" ||
                        (event as React.KeyboardEvent).key === "Delete") &&
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
                                        checked={selected || false}
                                        sx={{ py: 0, paddingLeft: 0 }}
                                    />
                                ) : null}
                                <Stack
                                    direction="column"
                                    justifyContent="center"
                                >
                                    {option.label}
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
                                        backgroundColor: option.color,
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
    );
};

export const FormAutocompleteContent = forwardRef(
    FormAutocompleteContentComp,
) as <F extends boolean | undefined, G extends boolean | undefined>(
    props: FormAutocompleteContentProps<F, G> & {
        ref?: Ref<ComponentRef<typeof FormAutocompleteContentComp>>;
    },
) => ReturnType<typeof FormAutocompleteContentComp>;

export default FormAutocompleteContent;
