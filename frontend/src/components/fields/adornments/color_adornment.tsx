import { Box, styled } from "@mui/material";
import { ComponentProps, forwardRef } from "react";

export type ColorAdornmentProps = {
    color: string;
    size?: "medium" | "small";
} & ComponentProps<typeof Box>;

export const ColorAdornmentStyled = styled(Box)<
    Pick<ColorAdornmentProps, "size">
>(({ theme, size }) => ({
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
}));

export const ColorAdornment = forwardRef<typeof Box, ColorAdornmentProps>(
    ({ color, sx, ...props }, ref) => {
        return (
            <ColorAdornmentStyled
                {...props}
                style={{ ...props.style, backgroundColor: color }}
                sx={sx}
                ref={ref}
            />
        );
    },
);
