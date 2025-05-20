import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueDraftT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import { useProjectData } from "../api/use_project_data";
import { DraftView } from "../components/issue/draft_view";

type IssueDraftProps = {
    draftId: string;
};

const IssueDraft: FC<IssueDraftProps> = ({ draftId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAction } = useNavbarSettings();

    const dispatch = useAppDispatch();

    const {
        data,
        isLoading,
        error: draftError,
    } = issueApi.useGetDraftQuery(draftId);

    const {
        project,
        isLoading: isProjectLoading,
        error: projectError,
    } = useProjectData({ projectId: data?.payload.project?.id });

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id: draftId })
                .unwrap()
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [draftId, updateDraft],
    );

    const draft = data?.payload;

    const handleCreateIssue = useCallback(async () => {
        if (!draft?.project) {
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
    }, [createIssue, draftId, draft?.project, navigate, t]);

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueDraftT>) => {
            if (!draft) return;

            dispatch(
                issueApi.util.updateQueryData("getDraft", draft.id, (draft) => {
                    draft.payload = deepmerge(draft.payload, issueValue, {
                        arrayMerge: (_, sourceArray) => sourceArray,
                    });
                }),
            );
        },
        [dispatch, draft],
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

    const error = draftError || projectError;

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
            {isLoading || isProjectLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                <>
                    {draft && (
                        <DraftView
                            draft={draft}
                            onUpdateDraft={handleSubmit}
                            project={project}
                            onUpdateCache={handleUpdateCache}
                            onCreateIssue={handleCreateIssue}
                            loading={
                                isLoading || updateLoading || createLoading
                            }
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
