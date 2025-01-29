import { Box, getContrastRatio, styled, useTheme } from "@mui/material";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

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
        const theme = useTheme();

        return (
            <ColorAdornmentStyled
                {...props}
                style={{
                    ...props.style,
                    backgroundColor: color,
                    color:
                        getContrastRatio(color, "#fff") >
                        theme.palette.contrastThreshold
                            ? "#fff"
                            : "#111",
                }}
                sx={sx}
                ref={ref}
            />
        );
    },
);
