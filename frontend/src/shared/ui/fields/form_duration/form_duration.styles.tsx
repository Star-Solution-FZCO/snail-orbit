import { styled } from "@mui/material";
import { theme } from "shared/theme";

export const StyledContainer = styled("form")(() => ({
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));
