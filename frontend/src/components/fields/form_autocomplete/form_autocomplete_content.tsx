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
    ReactNode,
    Ref,
    SyntheticEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { PopperComponent, StyledInput } from "./form_autocomplete.styles";

export type FormAutocompleteValueType = {
    label: string;
    description?: string | null;
    leftAdornment?: ReactNode;
    rightAdornment?: ReactNode;
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
    const { t } = useTranslation();

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
                            <Stack direction="row" gap={0.5}>
                                {multiple ? (
                                    <Checkbox
                                        sx={{ p: 0 }}
                                        checked={selected || false}
                                        size="small"
                                        disableRipple
                                    />
                                ) : null}
                                {/* TODO: Make left adornment be forshadowed by checkbox */}
                                {option.leftAdornment || null}
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
                                                ...t.applyStyles("light", {
                                                    color: "#586069",
                                                }),
                                            })}
                                        >
                                            {option.description}
                                        </Box>
                                    )}
                                </Stack>
                            </Stack>
                            {option.rightAdornment || null}
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
                    placeholder={t("autocomplete.filter")}
                    autoFocus
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
