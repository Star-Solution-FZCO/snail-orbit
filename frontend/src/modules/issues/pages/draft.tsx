import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import deepmerge from "deepmerge";
import { FC, useCallback } from "react";
import { issueApi, useAppDispatch } from "store";
import { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import IssueView from "../components/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/draft/$draftId");

const IssueDraft: FC = () => {
    const navigate = useNavigate();
    const { draftId } = routeApi.useParams();

    const dispatch = useAppDispatch();

    const { data, isLoading, error, refetch } =
        issueApi.useGetDraftQuery(draftId);

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createDraft, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: UpdateIssueT) => {
            await updateDraft({ ...formData, id: draftId })
                .unwrap()
                .catch(toastApiError);
        },
        [draftId, refetch],
    );

    const handleCreateDraft = useCallback(async () => {
        await createDraft(draftId)
            .unwrap()
            .then((issue) =>
                navigate({ to: `/issues/${issue.payload.id_readable}` }),
            )
            .catch(toastApiError);
    }, [draftId, navigate]);

    const issue = data?.payload;

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!issue) return;

            dispatch(
                issueApi.util.updateQueryData(
                    "getDraft",
                    issue.id_readable,
                    (draft) => {
                        draft.payload = deepmerge(draft.payload, issueValue, {
                            arrayMerge: (_, sourceArray) => sourceArray,
                        });
                    },
                ),
            );
        },
        [dispatch, issue],
    );

    if (error) {
        return <ErrorHandler error={error} message="issues.item.fetch.error" />;
    }

    return (
        <Container
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                px: 4,
                pb: 4,
            }}
            disableGutters
        >
            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                <>
                    {issue && (
                        <IssueView
                            loading={
                                isLoading || updateLoading || createLoading
                            }
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            onSaveIssue={handleCreateDraft}
                            issue={issue}
                            isDraft
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
