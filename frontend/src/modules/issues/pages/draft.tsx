import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import deepmerge from "deepmerge";
import { FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, useAppDispatch } from "store";
import { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import IssueView from "../components/issue/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/draft/$draftId");

const IssueDraft: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { draftId } = routeApi.useParams();

    const dispatch = useAppDispatch();

    const { data, isLoading, error, refetch } =
        issueApi.useGetDraftQuery(draftId);

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: UpdateIssueT) => {
            await updateDraft({ ...formData, id: draftId })
                .unwrap()
                .catch(toastApiError);
        },
        [draftId, refetch],
    );

    const issue = data?.payload;

    const handleCreateIssue = useCallback(async () => {
        if (!issue?.project) {
            toast.error(t("issues.project.required"));
            throw new Error(t("issues.project.required"));
        }

        await createIssue(draftId)
            .unwrap()
            .then((issue) =>
                navigate({ to: `/issues/${issue.payload.id_readable}` }),
            )
            .catch(toastApiError);
    }, [draftId, issue, navigate]);

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
                            issue={issue}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            onSaveIssue={handleCreateIssue}
                            loading={
                                isLoading || updateLoading || createLoading
                            }
                            isDraft
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
