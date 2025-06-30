import { Button, styled } from "@mui/material";

export const ActivityTypeButton = styled(Button, {
    shouldForwardProp: (name) => name !== "enabled",
})<{ enabled?: boolean }>(({ theme, enabled }) => ({
    borderRadius: 0,
    borderLeft: 0,
    borderRight: 0,
    borderBottom: 0,
    borderColor: enabled ? theme.palette.primary.main : theme.palette.divider,
    "& svg": {
        fill: enabled
            ? theme.palette.primary.main
            : theme.palette.action.disabled,
    },
    "&:hover": {
        borderLeft: 0,
        borderRight: 0,
        borderBottom: 0,
        borderColor: enabled
            ? theme.palette.primary.main
            : theme.palette.divider,
        "& svg": {
            fill: theme.palette.primary.main,
        },
    },
}));
