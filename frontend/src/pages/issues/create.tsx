import { Box, CircularProgress } from "@mui/material";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { issueApi } from "shared/model";

const IssueCreate: FC = () => {
    const navigate = useNavigate();
    const searchParams = useSearch({ from: "/_authenticated/issues/create" });

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
                        search: searchParams,
                        replace: true,
                    }),
                )
                .finally(() => {
                    awaitingRef.current = false;
                });
        }
    }, [isLoading, createDraft, navigate, searchParams]);

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
