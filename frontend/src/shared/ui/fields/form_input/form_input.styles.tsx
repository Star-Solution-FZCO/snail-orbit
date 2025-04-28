import { styled } from "@mui/material";
import { theme } from "shared/theme";
import { FieldInput } from "../field_input/field_input";

export const StyledInput = styled(FieldInput)(() => ({
    width: "100%",
}));

export const StyledContainer = styled("form")(() => ({
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));
