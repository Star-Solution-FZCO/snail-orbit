import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { IssueT, UpdateIssueT } from "shared/model/types";
import { issueApi, useAppDispatch } from "shared/model";
import { ErrorHandler, Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import IssueView from "../components/issue/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/draft/$draftId");

const IssueDraft: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { draftId } = routeApi.useParams();
    const { setAction } = useNavbarSettings();

    const dispatch = useAppDispatch();

    const { data, isLoading, error } = issueApi.useGetDraftQuery(draftId);

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: UpdateIssueT) => {
            await updateDraft({ ...formData, id: draftId })
                .unwrap()
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [draftId, updateDraft],
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
            .catch((error) => {
                toastApiError(error);
                return Promise.reject(error);
            });
    }, [createIssue, draftId, issue?.project, navigate, t]);

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

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction, t]);

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
