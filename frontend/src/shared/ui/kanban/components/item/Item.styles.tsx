import { keyframes, styled } from "@mui/material";

// TODO: Use MUI theme here (or not?)
const boxShadowBorder =
    "0 0 0 calc(1px / var(--scale-x, 1)) rgba(63, 63, 68, 0.05)";
const boxShadowCommon =
    "0 1px calc(3px / var(--scale-x, 1)) 0 rgba(34, 33, 81, 0.15)";
const boxShadow = `${boxShadowBorder}, ${boxShadowCommon}`;

const fadeInEffect = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

const popEffect = keyframes`
    0% {
        transform: scale(1);
        box-shadow: var(--box-shadow);
    }
    100% {
        transform: scale(var(--scale));
        box-shadow: var(--box-shadow-picked-up);
    }
`;

export type ItemContainerProps = {
    fadeIn?: boolean;
    dragOverlay?: boolean;
};

export const ItemContainer = styled("li")<ItemContainerProps>(
    ({ fadeIn, theme, dragOverlay }) => ({
        display: "flex",
        boxSizing: "border-box",
        transform:
            "translate3d(var(--translate-x, 0), var(--translate-y, 0), 0) scaleX(var(--scale-x, 1)) scaleY(var(--scale-y, 1))",
        transformOrigin: "0 0",
        touchAction: "manipulation",
        ...(fadeIn
            ? {
                  animation: `${fadeInEffect} ${theme.transitions.duration.standard} ${theme.transitions.easing.easeIn}`,
              }
            : {}),
        ...(dragOverlay
            ? {
                  "--scale": "1.05",
                  "--box-shadow": boxShadow,
                  "--box-shadow-picked-up": boxShadowBorder,
                  zIndex: theme.zIndex.tooltip - 1,
              }
            : {}),
    }),
);

export type ItemStyledProps = {
    dragging?: boolean;
    disabled?: boolean;
    dragOverlay?: boolean;
    focusVisible?: boolean;
};

export const ItemStyled = styled("div")<ItemStyledProps>(
    ({ theme, disabled, dragging, dragOverlay }) => ({
        position: "relative",
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        backgroundColor: theme.palette.background.paper,
        boxShadow: boxShadow,
        outline: "none",
        borderRadius: "calc(4px / var(--scale-x, 1))",
        boxSizing: "border-box",
        listStyle: "none",
        transformOrigin: "50% 50%",
        WebkitTapHighlightColor: "transparent",
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightRegular,
        fontSize: theme.typography.fontSize,
        whiteSpace: "nowrap",

        transform: "scale(var(--scale, 1))",
        transition: `box-shadow ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut}`,

        touchAction: "manipulation",

        "&:focus-visible": {
            boxShadow: `0 0 4px 1px ${theme.palette.primary.main}, ${boxShadow}`,
        },

        ...(dragging && !dragOverlay
            ? {
                  opacity: 0.5,
                  zIndex: 0,

                  "&:focus": {
                      boxShadow: boxShadow,
                  },
              }
            : {}),

        ...(disabled
            ? {
                  color: theme.palette.text.disabled,
                  cursor: "not-allowed",

                  "&:focus": {
                      boxShadow: `0 0 4px 1px rgba(0, 0, 0, 0.1), ${boxShadow}`,
                  },
              }
            : {}),

        ...(dragOverlay
            ? {
                  cursor: "inherit",
                  animation: `${popEffect} ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut}`,
                  transform: "scale(var(--scale))",
                  boxShadow: "var(--box-shadow-picked-up)",
                  opacity: 1,
              }
            : {}),
    }),
);
