import { Box, CircularProgress } from "@mui/material";
import { memo } from "react";

export const AgileBoardsIndexPage = memo(() => {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <CircularProgress size={50} />
        </Box>
    );
});

AgileBoardsIndexPage.displayName = "AgileBoardsIndexPage";
