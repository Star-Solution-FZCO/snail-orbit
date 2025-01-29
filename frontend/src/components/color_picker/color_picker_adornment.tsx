import React, { memo, useState } from "react";
import type { ColorAdornmentProps } from "../fields/adornments/color_adornment";
import { ColorAdornment } from "../fields/adornments/color_adornment";
import { ColorPickerPopover } from "./color_picker_popover";

export type ColorPickerAdornmentProps = {
    color: string;
    onChange: (color: string) => void;
} & Pick<ColorAdornmentProps, "size" | "children">;

export const ColorPickerAdornment = memo((props: ColorPickerAdornmentProps) => {
    const { onChange, color, ...rest } = props;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleClickColorPicker = (
        event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
        if (!("key" in event) || event.key === "Enter")
            setAnchorEl(event.currentTarget);
    };

    const handleCloseColorPicker = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <ColorAdornment
                color={color || ""}
                onClick={handleClickColorPicker}
                onKeyDown={handleClickColorPicker}
                tabIndex={0}
                {...rest}
            />

            <ColorPickerPopover
                open={!!anchorEl}
                anchorEl={anchorEl}
                color={color || ""}
                onClose={handleCloseColorPicker}
                onChange={onChange}
            />
        </>
    );
});

ColorPickerAdornment.displayName = "ColorPickerAdornment";
