import { getContrastRatio } from "@mui/material";
import { theme } from "./index";

export const getContrastText = (color: string) => {
    try {
        return getContrastRatio(color, "#fff") > theme.palette.contrastThreshold
            ? "#fff"
            : "#111";
    } catch {
        return null;
    }
};
