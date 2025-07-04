import { Box, styled } from "@mui/material";
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { getContrastText } from "shared/theme/contrast-text";

export type ColorAdornmentProps = {
    color: string;
    size?: "medium" | "small" | "xsmall";
} & ComponentProps<typeof Box>;

export const ColorAdornmentStyled = styled(Box)<
    Pick<ColorAdornmentProps, "size" | "onClick">
>(({ theme, onClick, size = "small" }) => ({
    flexShrink: 0,
    borderRadius: 3,
    cursor: onClick ? "pointer" : "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    ...(size === "small"
        ? {
              width: theme.typography.pxToRem(20),
              height: theme.typography.pxToRem(20),
          }
        : {}),

    ...(size === "medium"
        ? {
              width: theme.typography.pxToRem(26),
              height: theme.typography.pxToRem(26),
          }
        : {}),

    ...(size === "xsmall"
        ? {
              width: theme.typography.pxToRem(10),
              height: theme.typography.pxToRem(10),
              borderRadius: "50%",
          }
        : {}),
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
