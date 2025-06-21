import type { AutocompleteCloseReason, AutocompleteProps } from "@mui/material";
import { Autocomplete, Box, Checkbox, Stack } from "@mui/material";
import type { ComponentProps, ReactNode, SyntheticEvent } from "react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "../../link";
import {
    BottomSlot,
    PopperComponent,
    StyledInput,
} from "./form_autocomplete.styles";

export type FormAutocompleteContentProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
> = Omit<
    AutocompleteProps<Value, Multiple, DisableClearable, false>,
    "renderOption" | "renderInput" | "renderTags" | "open"
> & {
    inputProps?: ComponentProps<typeof StyledInput>;
    bottomSlot?: ReactNode;
    getOptionLeftAdornment?: (el: Value) => ReactNode;
    getOptionRightAdornment?: (el: Value) => ReactNode;
    getOptionDescription?: (el: Value) => ReactNode;
    getOptionLink?: (el: Value) => string;
};

export const FormAutocompleteContent = <
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
>({
    multiple,
    onClose,
    onChange,
    options,
    inputProps,
    bottomSlot,
    getOptionLeftAdornment,
    getOptionRightAdornment,
    getOptionDescription,
    getOptionLabel,
    getOptionLink,
    ...props
}: FormAutocompleteContentProps<Value, Multiple, DisableClearable>) => {
    const { t } = useTranslation();

    return (
        <>
            <Autocomplete<Value, Multiple, DisableClearable>
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
                slots={{
                    popper: PopperComponent,
                }}
                renderTags={() => null}
                renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                        <Box component="li" key={key} {...optionProps}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                sx={{
                                    width: 1,
                                    textDecoration: "none",
                                }}
                                alignItems="center"
                                component={getOptionLink ? Link : "div"}
                                to={getOptionLink?.(option)}
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
                                    {getOptionLeftAdornment?.(option)}
                                    <Stack
                                        direction="column"
                                        justifyContent="center"
                                    >
                                        {getOptionLabel?.(option)}
                                        {getOptionDescription && (
                                            <Box
                                                component="span"
                                                sx={(t) => ({
                                                    color: "#8b949e",
                                                    ...t.applyStyles("light", {
                                                        color: "#586069",
                                                    }),
                                                })}
                                            >
                                                {getOptionDescription(option)}
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>
                                {getOptionRightAdornment?.(option)}
                            </Stack>
                        </Box>
                    );
                }}
                options={options}
                renderInput={(params) => {
                    return (
                        <StyledInput
                            placeholder={t("autocomplete.filter")}
                            {...inputProps}
                            ref={params.InputProps.ref}
                            inputProps={params.inputProps}
                            autoFocus
                        />
                    );
                }}
                renderGroup={({ group, key, children }) => (
                    <li key={key}>
                        <Box sx={{ textAlign: "right", px: 2 }}>{group}</Box>
                        <Box component="ul" sx={{ p: 0 }}>
                            {children}
                        </Box>
                    </li>
                )}
                getOptionLabel={getOptionLabel}
                {...props}
            />
            {bottomSlot ? <BottomSlot>{bottomSlot}</BottomSlot> : null}
        </>
    );
};

export default FormAutocompleteContent;
