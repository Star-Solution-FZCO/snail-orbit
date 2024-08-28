import { styled } from "@mui/material";
import { theme } from "../../../theme";

export const StyledContainer = styled("form")(() => ({
    padding: 4,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));
