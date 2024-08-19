import { createTheme } from "@mui/material";
import "./theme.types";

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            content: "#23272b",
        },
    },
    typography: {
        fontSize: 14,
    },
});

export default theme;
