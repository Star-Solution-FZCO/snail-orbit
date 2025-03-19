import { styled } from "@mui/material";

export const FieldOffside = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    minWidth: "300px",
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    flexGrow: 1,
}));
