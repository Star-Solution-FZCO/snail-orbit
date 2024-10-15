import { Box, CircularProgress } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { FC, useEffect, useRef } from "react";
import { issueApi } from "store";

const IssueCreate: FC = () => {
    const navigate = useNavigate();

    const [createDraft, { isLoading }] = issueApi.useCreateDraftMutation();
    const awaitingRef = useRef<boolean>(false);

    useEffect(() => {
        if (!isLoading && !awaitingRef.current) {
            awaitingRef.current = true;
            createDraft()
                .unwrap()
                .then((resp) => navigate({ to: `/draft/${resp.payload.id}` }))
                .finally(() => {
                    awaitingRef.current = false;
                });
        }
    }, [isLoading, createDraft]);

    return (
        <Box
            sx={{
                width: 1,
                height: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <CircularProgress />
        </Box>
    );
};

export { IssueCreate };
