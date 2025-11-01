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
                    board: "#f6f8fa",
                    boardFocused: "#efeff3",
                },
            },
        },
    },
    typography: {
        fontSize: 14,
        button: {
            textTransform: "none",
        },
    },
});

export default theme;
