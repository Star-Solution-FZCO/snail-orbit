import { Avatar, styled } from "@mui/material";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

export type AvatarAdornmentProps = {
    size?: "medium" | "small" | "xsmall";
} & ComponentProps<typeof Avatar>;

export const AvatarAdornmentStyled = styled(Avatar)<
    Pick<AvatarAdornmentProps, "size">
>(({ theme, size = "small" }) => ({
    flexShrink: 0,
    borderRadius: 3,
    margin: 0,
    marginRight: "0 !important",

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

export const AvatarAdornment = forwardRef<HTMLDivElement, AvatarAdornmentProps>(
    ({ color, sx, ...props }, ref) => {
        return (
            <AvatarAdornmentStyled
                {...props}
                style={{ ...props.style, backgroundColor: color }}
                sx={sx}
                ref={ref}
            />
        );
    },
);
