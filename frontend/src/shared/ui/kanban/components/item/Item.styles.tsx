import { styled } from "@mui/material";

// TODO: Use MUI theme here (or not?)
const boxShadowBorder =
    "0 0 0 calc(1px / var(--scale-x, 1)) rgba(63, 63, 68, 0.05)";
const boxShadowCommon =
    "0 1px calc(3px / var(--scale-x, 1)) 0 rgba(34, 33, 81, 0.15)";
const boxShadow = `${boxShadowBorder}, ${boxShadowCommon}`;

export type ItemStyledProps = {};

export const ItemStyled = styled("li")<ItemStyledProps>(({ theme }) => ({
    position: "relative",
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: theme.palette.background.paper,
    boxShadow: boxShadow,
    outline: "none",
    boxSizing: "border-box",
    listStyle: "none",
    transformOrigin: "50% 50%",
    WebkitTapHighlightColor: "transparent",
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.fontSize,
    whiteSpace: "nowrap",
    borderRadius: theme.shape.borderRadius,

    transform: "scale(var(--scale, 1))",
    transition: `box-shadow ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut}`,

    touchAction: "manipulation",

    "&:focus-visible": {
        boxShadow: `0 0 4px 1px ${theme.palette.primary.main}, ${boxShadow}`,
    },
}));
