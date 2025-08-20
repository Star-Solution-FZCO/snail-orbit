import { styled } from "@mui/material";

export const HeaderStyled = styled("div", {
    label: "kanbanHeader",
})<{ isClosed?: boolean }>(({ theme, isClosed }) => ({
    display: "flex",
    padding: theme.spacing(1),
    gap: theme.spacing(1),
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.background.board,
    flexGrow: isClosed ? 0 : 1,
    borderRight: "1px solid",
    borderColor: "inherit",
    flexBasis: 0,
    whiteSpace: "nowrap",
    width: isClosed ? "60px" : "100%",
    minWidth: "60px",
    overflow: "hidden",
    textOverflow: "ellipsis",

    "&:last-of-type": {
        borderRight: 0,
    },
}));

export const HeaderStyledContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderColor: theme.palette.grey["700"],
    borderBottom: `1px solid ${theme.palette.grey["700"]}`,
    borderTop: `1px solid ${theme.palette.grey["700"]}`,
    scrollbarGutter: "stable",
    overflow: "auto",
    backgroundColor: theme.palette.background.board,
}));
