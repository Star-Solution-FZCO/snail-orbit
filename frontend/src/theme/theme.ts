import { createTheme } from "@mui/material";
import "theme/theme.types.ts";

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            content: "#23272b",
        },
    },
});

export default theme;
