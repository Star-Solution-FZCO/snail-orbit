import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { useDraftOperations } from "entities/issue/api/use_draft_operations";
import { useProjectData } from "entities/issue/api/use_project_data";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import { DraftView } from "../components/issue/draft_view";

type IssueDraftProps = {
    draftId: string;
};

const IssueDraft: FC<IssueDraftProps> = ({ draftId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const canGoBack = useCanGoBack();
    const router = useRouter();
    const { setAction } = useNavbarSettings();

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

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const { updateDraft, updateDraftCache, isDraftUpdateLoading } =
        useDraftOperations({ draftId });

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id: draftId }).catch((error) => {
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

    const handleGoBack = () => {
        if (canGoBack) router.history.back();
        else navigate({ to: "/issues", replace: true });
    };

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
                            onUpdateCache={updateDraftCache}
                            onCreateIssue={handleCreateIssue}
                            onGoBack={handleGoBack}
                            loading={
                                isLoading ||
                                isDraftUpdateLoading ||
                                createLoading
                            }
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
