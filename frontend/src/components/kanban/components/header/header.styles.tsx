import { styled } from "@mui/material";

// TODO: Move to theme and sync with custom fields
const backgroundColor = "#1c2128";

export const HeaderStyled = styled("div", { label: "kanbanHeader" })(
    ({ theme }) => ({
        display: "flex",
        padding: theme.spacing(1),
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: backgroundColor,
        flexGrow: 1,
        borderRight: "1px solid",
        borderColor: "inherit",
        flexBasis: 0,

        "&:last-of-type": {
            borderRight: 0,
        },
    }),
);

export const HeaderStyledContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    width: "100%",
    borderColor: theme.palette.grey["700"],
    borderBottom: `1px solid ${theme.palette.grey["700"]}`,
    borderTop: `1px solid ${theme.palette.grey["700"]}`,
    position: "sticky",
    top: 0,
    zIndex: 10,
}));
