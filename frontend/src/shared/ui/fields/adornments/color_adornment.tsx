import { Box, styled } from "@mui/material";
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { getContrastText } from "shared/theme/contrast-text";

export type ColorAdornmentProps = {
    color: string;
    size?: "medium" | "small";
} & ComponentProps<typeof Box>;

export const ColorAdornmentStyled = styled(Box)<
    Pick<ColorAdornmentProps, "size" | "onClick">
>(({ theme, size, onClick }) => ({
    width:
        size === "small"
            ? theme.typography.pxToRem(20)
            : theme.typography.pxToRem(26),
    height:
        size === "small"
            ? theme.typography.pxToRem(20)
            : theme.typography.pxToRem(26),
    flexShrink: 0,
    borderRadius: 3,
    cursor: onClick ? "pointer" : "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}));

export const ColorAdornment = forwardRef<typeof Box, ColorAdornmentProps>(
    ({ color, sx, ...props }, ref) => {
        return (
            <ColorAdornmentStyled
                {...props}
                style={{
                    ...props.style,
                    backgroundColor: color,
                    color: getContrastText(color || "#000"),
                }}
                sx={sx}
                ref={ref}
            />
        );
    },
);
