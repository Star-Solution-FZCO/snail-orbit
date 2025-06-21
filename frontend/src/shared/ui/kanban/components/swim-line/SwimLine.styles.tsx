import { styled } from "@mui/material";

export type StyledSwimLineProps = {
    scrollable?: boolean;
    shadow?: boolean;
    focusVisible?: boolean;
};

export const StyledSwimLine = styled("div")<StyledSwimLineProps>(
    ({ theme, scrollable, shadow, focusVisible }) => ({
        display: "flex",
        flexDirection: "column",
        gridAutoRows: "max-content",
        overflow: "hidden",
        boxSizing: "border-box",
        appearance: "none",
        outline: "none",
        transition: theme.transitions.create("background-color", {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
        }),
        backgroundColor: theme.palette.background.board,
        fontSize: theme.typography.fontSize,

        borderBottom: "1px solid",
        borderColor: theme.palette.grey["700"],

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

        ...(focusVisible
            ? {
                  borderColor: "transparent",
                  boxShadow:
                      "0 0 0 2px rgba(255, 255, 255, 0), 0 0px 0px 2px #4c9ffe",
              }
            : {}),
    }),
);

export const StyledSwimLineList = styled("ul")(({ theme }) => ({
    listStyle: "none",
    margin: 0,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    flexGap: theme.spacing(1),
    padding: 0,
}));

export const HeaderStyled = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.background.board,
}));
