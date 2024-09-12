import { alpha, styled } from "@mui/material";

export const FieldCardWrapper = styled("div")<{ error?: boolean }>(
    ({ theme, error }) => ({
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingTop: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.5),
        transition: theme.transitions.create(["background-color"], {
            duration: theme.transitions.duration.shorter,
        }),
        cursor: "pointer",
        "&:hover": {
            backgroundColor: alpha(theme.palette.primary.dark, 0.4),
        },
        backgroundColor: error
            ? alpha(theme.palette.error.light, 0.4)
            : "transparent",
    }),
);
