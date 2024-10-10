import { styled } from "@mui/material";

// TODO: Move to theme and sync with custom fields
const backgroundColor = "#1c2128";
const activeBackgroundColor = "#192030";

export type StyledContainerProps = {
    scrollable?: boolean;
    placeholder?: boolean;
    shadow?: boolean;
    focusVisible?: boolean;
    hover?: boolean;
};

export const StyledContainer = styled("div", {
    label: "kanbanContainer",
})<StyledContainerProps>(
    ({ theme, scrollable, placeholder, shadow, focusVisible, hover }) => ({
        display: "flex",
        flexDirection: "column",
        gridAutoRows: "max-content",
        overflow: "hidden",
        boxSizing: "border-box",
        appearance: "none",
        outline: "none",
        minHeight: "200px",
        width: "100%",
        transition: theme.transitions.create("background-color", {
            duration: theme.transitions.duration.standard,
            easing: theme.transitions.easing.easeInOut,
        }),
        backgroundColor: backgroundColor,
        fontSize: theme.typography.fontSize,
        borderRight: "1px solid",
        borderColor: theme.palette.grey["700"],
        flexBasis: 0,
        flexGrow: 1,

        "&:last-of-type": {
            borderRight: 0,
        },

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
}));

export const HeaderStyled = styled("div", { label: "kanbanContainerHeader" })(
    ({ theme }) => ({
        display: "flex",
        padding: theme.spacing(1),
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: backgroundColor,
        borderTopLeftRadius: "5px",
        borderTopRightRadius: "5px",
    }),
);
