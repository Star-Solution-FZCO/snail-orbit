import { styled } from "@mui/material";

export type StyledContainerProps = {
    scrollable?: boolean;
    placeholder?: boolean;
    horizontal?: boolean;
    shadow?: boolean;
    focusVisible?: boolean;
    hover?: boolean;
};

export const StyledContainer = styled("div")<StyledContainerProps>(
    ({
        theme,
        scrollable,
        placeholder,
        horizontal,
        shadow,
        focusVisible,
        hover,
    }) => ({
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
        backgroundColor: theme.palette.background.default,
        border: "1px solid rgba(0, 0, 0, 0.05)",
        fontSize: theme.typography.fontSize,

        "& ul": {
            display: "grid",
            gridGap: "10px",
            gridTemplateColumns: "repeat(var(--columns, 1), 1fr)",
            listStyle: "none",
            padding: "20px",
            margin: 0,
        },

        ...(hover
            ? {
                  backgroundColor: "rgb(235, 235, 235, 1)",
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

        ...(horizontal
            ? {
                  width: "100%",

                  "& ul": {
                      gridAutoFlow: "column",
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

export const HeaderStyled = styled("div")(({ theme }) => ({
    display: "flex",
    padding: theme.spacing(2),
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.background.paper,
    borderTopLeftRadius: "5px",
    borderTopRightRadius: "5px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
}));
