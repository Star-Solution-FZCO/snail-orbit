import { createTheme } from "@mui/material";

const theme = createTheme({
    colorSchemes: {
        dark: true,
        light: true,
    },
    palette: {
        mode: "dark",
        background: {
            default: "#23272b",
        },
    },
    typography: {
        fontSize: 14,
    },
});

export default theme;
