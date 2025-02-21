import { createTheme } from "@mui/material";
import "./theme.types";

const theme = createTheme({
    colorSchemes: {
        dark: {
            palette: {
                background: {
                    default: "#23272b",
                    board: "#1c2128",
                    boardFocused: "#192030",
                },
            },
        },
        light: {
            palette: {
                background: {
                    board: "#fff",
                    boardFocused: "#a4a7c6",
                },
            },
        },
    },
    typography: {
        fontSize: 14,
    },
});

export default theme;
