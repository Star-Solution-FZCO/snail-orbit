import { Button, styled } from "@mui/material";

export const ToolbarButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
    width: 32,
    height: 32,
    minWidth: "unset",
    padding: theme.spacing(0.25),
    backgroundColor: active
        ? theme.palette.background.paper
        : theme.palette.background.default,
    color: active ? theme.palette.primary.dark : theme.palette.text.primary,
}));
