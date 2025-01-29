import type { PopoverProps } from "@mui/material";
import { Card, Popover } from "@mui/material";
import { memo } from "react";
import { HexColorPicker } from "react-colorful";

export type ColorPickerPopoverProps = Omit<PopoverProps, "onChange"> & {
    color: string;
    onChange: (value: string) => void;
};

export const ColorPickerPopover = memo((props: ColorPickerPopoverProps) => {
    const { color, onChange, ...rest } = props;

    return (
        <Popover
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            {...rest}
        >
            <Card>
                <HexColorPicker color={color} onChange={onChange} />
            </Card>
        </Popover>
    );
});

ColorPickerPopover.displayName = "ColorPickerPopover";
