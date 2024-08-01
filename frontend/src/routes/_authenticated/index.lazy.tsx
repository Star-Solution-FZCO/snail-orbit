import { Box, Typography } from "@mui/material";
import { createLazyFileRoute } from "@tanstack/react-router";

const Index = () => {
    return (
        <Box p={4}>
            <Typography variant="h5">Project Manager</Typography>
        </Box>
    );
};

export const Route = createLazyFileRoute("/_authenticated/")({
    component: Index,
});
