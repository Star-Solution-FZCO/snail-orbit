import { Box, styled } from "@mui/material";

export const StyledDayPickerContainer = styled(Box)(({ theme }) => ({
    "& .rdp-root": {
        "--rdp-accent-color": theme.palette.primary.dark,
        "--rdp-accent-background-color": theme.palette.action.selected,
    },
}));
