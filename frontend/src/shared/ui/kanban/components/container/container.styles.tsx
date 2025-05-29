import { styled } from "@mui/material";

export type StyledContainerProps = {
    scrollable?: boolean;
    shadow?: boolean;
    hover?: boolean;
    isClosed?: boolean;
};

export const StyledContainer = styled("div", {
    label: "kanbanContainer",
})<StyledContainerProps>(({ theme, scrollable, shadow, hover, isClosed }) => ({
    display: "flex",
    flexDirection: "column",
    gridAutoRows: "max-content",
    overflow: "hidden",
    boxSizing: "border-box",
    appearance: "none",
    outline: "none",
    minHeight: "200px",
    width: isClosed ? "60px" : "100%",
    transition: theme.transitions.create("background-color", {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
    }),
    backgroundColor: theme.palette.background.board,
    fontSize: theme.typography.fontSize,
    borderRight: "1px solid",
    borderColor: theme.palette.grey["700"],
    flexBasis: 0,
    flexGrow: isClosed ? 0 : 1,
    minWidth: "60px",

    "&:last-of-type": {
        borderRight: 0,
    },

    ...(hover
        ? {
              backgroundColor: theme.palette.background.boardFocused,
          }
        : {}),

    ...(scrollable
        ? {
              "& ul": {
                  overflowY: "auto",
              },
          }
        : {}),

    ...(shadow
        ? {
              boxShadow: "0 1px 10px 0 rgba(34, 33, 81, 0.1)",
          }
        : {}),
}));

export const StyledContainerList = styled("ul", {
    label: "kanbanContainerList",
})(({ theme }) => ({
    display: "grid",
    gridGap: "10px",
    gridTemplateColumns: "repeat(var(--columns, 1), 1fr)",
    listStyle: "none",
    padding: theme.spacing(1),
    margin: 0,
    width: "100%",

    "& div, & li": {
        minWidth: 0,
    },
}));
