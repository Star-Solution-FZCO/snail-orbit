import { styled } from "@mui/material";

export const FieldContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    width: "300px",
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.primary.main,
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.background.paper,
    position: "sticky",
    top: "36px",
}));
