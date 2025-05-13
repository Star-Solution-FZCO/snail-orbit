import { Box, CircularProgress } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { issueApi } from "shared/model";

const IssueCreate: FC = () => {
    const navigate = useNavigate();

    const [createDraft, { isLoading }] = issueApi.useCreateDraftMutation();
    const awaitingRef = useRef<boolean>(false);

    useEffect(() => {
        if (!isLoading && !awaitingRef.current) {
            awaitingRef.current = true;
            createDraft()
                .unwrap()
                .then((resp) =>
                    navigate({
                        to: `/issues/draft/${resp.payload.id}`,
                        replace: true,
                    }),
                )
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
