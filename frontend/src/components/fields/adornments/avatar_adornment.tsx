import { Avatar, styled } from "@mui/material";
import { ComponentProps, forwardRef } from "react";

export type AvatarAdornmentProps = {
    size?: "medium" | "small";
} & ComponentProps<typeof Avatar>;

export const AvatarAdornmentStyled = styled(Avatar)<
    Pick<AvatarAdornmentProps, "size">
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
    margin: 0,
    marginRight: "0 !important",
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
