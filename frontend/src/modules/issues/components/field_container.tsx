import { styled } from "@mui/material";

export const FieldContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "auto",
    maxHeight: "calc(100dvh - 100px)",
    width: "310px",
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    position: "sticky",
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: "3px",
    backgroundColor: theme.palette.background.paper,
}));
