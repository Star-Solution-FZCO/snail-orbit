// TODO: Move to theme and sync with custom fields
import { styled } from "@mui/material";

const backgroundColor = "#1c2128";
const activeBackgroundColor = "#192030";

export type StyledSwimLineProps = {
    scrollable?: boolean;
    placeholder?: boolean;
    shadow?: boolean;
    focusVisible?: boolean;
    hover?: boolean;
};

export const StyledSwimLine = styled("div")<StyledSwimLineProps>(
    ({ theme, scrollable, placeholder, shadow, focusVisible, hover }) => ({
        display: "flex",
        flexDirection: "column",
        gridAutoRows: "max-content",
        overflow: "hidden",
        boxSizing: "border-box",
        appearance: "none",
        outline: "none",
        minWidth: "350px",
        margin: "10px",
        borderRadius: theme.spacing(1),
        minHeight: "200px",
        transition: theme.transitions.create("background-color", {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
        }),
        backgroundColor: backgroundColor,
        fontSize: theme.typography.fontSize,

        ...(hover
            ? {
                  backgroundColor: activeBackgroundColor,
              }
            : {}),

        ...(scrollable
            ? {
                  "& ul": {
                      overflowY: "auto",
                  },
              }
            : {}),

        ...(placeholder
            ? {
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  color: "rgba(0,0,0,0.5)",
                  backgroundColor: "transparent",
                  borderStyle: "dashed",
                  borderColor: "rgba(0, 0, 0, 0.08)",

                  "&:hover": {
                      borderColor: "rgba(0, 0, 0, 0.15)",
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
    padding: "20px",
    margin: 0,
    width: "100%",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    flexGap: theme.spacing(1),
}));

export const HeaderStyled = styled("div")(({ theme }) => ({
    display: "flex",
    padding: theme.spacing(2),
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: backgroundColor,
    borderTopLeftRadius: "5px",
    borderTopRightRadius: "5px",
}));
