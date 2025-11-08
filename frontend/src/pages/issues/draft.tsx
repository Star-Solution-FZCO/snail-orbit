import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
    useCanGoBack,
    useNavigate,
    useRouter,
    useSearch,
} from "@tanstack/react-router";
import { useDraftOperations } from "entities/issue/api/use_draft_operations";
import { useIssueTemplate } from "entities/issue/api/use_issue_template";
import { useProjectData } from "entities/issue/api/use_project_data";
import { DraftView } from "modules/issues/components/issue/draft_view";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, projectApi, useAppSelector } from "shared/model";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";

type IssueDraftProps = {
    draftId: string;
};

const IssueDraft: FC<IssueDraftProps> = ({ draftId }) => {
    const { t } = useTranslation();

    const navigate = useNavigate();
    const canGoBack = useCanGoBack();

    const router = useRouter();
    const searchParams = useSearch({
        from: "/_authenticated/issues/draft/$draftId",
    });

    const { setAction } = useNavbarSettings();

    const { user } = useAppSelector((state) => state.profile);

    const { parseTemplateParams, applyTemplateToFields } = useIssueTemplate();
    const templateAppliedRef = useRef(false);

    const {
        data,
        isLoading,
        error: draftError,
    } = issueApi.useGetDraftQuery(draftId);

    const draft = data?.payload;

    const { projectSlug, fields } = useMemo(
        () => parseTemplateParams(searchParams),
        [searchParams, parseTemplateParams],
    );

    const { data: templateProjectData } = projectApi.useGetProjectQuery(
        projectSlug && !draft?.project ? projectSlug : skipToken,
    );

    const templateProject = templateProjectData?.payload;

    const {
        project,
        isLoading: isProjectLoading,
        error: projectError,
        isEncrypted,
        encryptionKeys,
    } = useProjectData({
        projectId: draft?.project?.id || templateProject?.id,
    });

    const isUserAddedToEncryption = useMemo(() => {
        if (!isEncrypted) return false;
        if (!user) return false;
        return !!encryptionKeys.some((key) => key.target_id === user.id);
    }, [encryptionKeys, isEncrypted, user]);

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const {
        updateDraft,
        updateDraftCache,
        isDraftUpdateLoading,
        isLoading: isDraftOperationsLoading,
    } = useDraftOperations({ draftId });

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id: draftId }).catch((error) => {
                toastApiError(error);
                return Promise.reject(error);
            });
        },
        [draftId, updateDraft],
    );

    const handleCreateIssue = useCallback(async () => {
        if (!draft?.project) {
            toast.error(t("issues.project.required"));
            throw new Error(t("issues.project.required"));
        }

        await createIssue(draftId)
            .unwrap()
            .then((issue) =>
                navigate({
                    to: `/issues/$issueId/{-$subject}`,
                    params: { issueId: issue.payload.id_readable },
                }),
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

    useEffect(() => {
        if (
            !templateAppliedRef.current &&
            draft &&
            project &&
            !isLoading &&
            !isProjectLoading &&
            (Object.keys(fields).length > 0 || projectSlug)
        ) {
            templateAppliedRef.current = true;

            const updatePayload: IssueUpdate = {};

            if (projectSlug && projectSlug === project.slug && !draft.project) {
                updatePayload.project_id = project.id;
            }

            if (Object.keys(fields).length > 0 && project.custom_fields) {
                const fieldsWithValue = project.custom_fields.map((field) => ({
                    ...field,
                    value: null,
                }));

                const appliedFields = applyTemplateToFields(
                    fieldsWithValue,
                    fields,
                );

                if (Object.keys(appliedFields).length > 0) {
                    updatePayload.fields = appliedFields;
                }
            }

            if (Object.keys(updatePayload).length > 0) {
                updateDraft({ ...updatePayload, id: draftId }).catch(
                    (error) => {
                        console.error("Failed to apply template:", error);
                    },
                );
            }
        }
    }, [
        draft,
        project,
        isLoading,
        isProjectLoading,
        fields,
        projectSlug,
        applyTemplateToFields,
        updateDraft,
        draftId,
    ]);

    const error = draftError || projectError;

    if (error) {
        return (
            <ErrorHandler
                error={error}
                message={t("issues.item.fetch.error")}
            />
        );
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
                                isDraftOperationsLoading ||
                                createLoading
                            }
                            isEncrypted={isEncrypted}
                            isUserAddedToEncryption={isUserAddedToEncryption}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export { IssueDraft };
