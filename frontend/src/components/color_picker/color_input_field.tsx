import type { TextFieldProps } from "@mui/material";
import { InputAdornment, TextField } from "@mui/material";
import { memo } from "react";
import { ColorPickerAdornment } from "./color_picker_adornment";

export type ColorInputFieldProps = {
    color: string;
    onChange: (color: string) => void;
} & Omit<TextFieldProps, "value" | "onChange" | "color">;

export const ColorInputField = memo((props: ColorInputFieldProps) => {
    const { color, onChange, size, ...rest } = props;

    return (
        <>
            <TextField
                value={color}
                onChange={(e) => onChange(e.target.value)}
                size={size}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <ColorPickerAdornment
                                    color={color}
                                    onChange={onChange}
                                    size={size}
                                />
                            </InputAdornment>
                        ),
                    },
                }}
                {...rest}
            />
        </>
    );
});

ColorInputField.displayName = "ColorInputField";
