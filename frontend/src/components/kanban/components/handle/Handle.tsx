import { Box } from "@mui/material";
import { forwardRef } from "react";

export const Handle = forwardRef<HTMLButtonElement>((props, ref) => {
    return (
        <Box
            component="button"
            sx={{
                cursor: "grab",
                background: "none",
                outline: "none",
                border: "none",
                color: "inherit",
                display: "flex",
                justifyContent: "center",
            }}
            ref={ref}
            {...props}
        >
            <svg viewBox="0 0 20 20" height="12" width="12">
                <path
                    fill="currentColor"
                    d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"
                ></path>
            </svg>
        </Box>
    );
});
