import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useIssueOperations } from "entities/issue/api/use_issue_operations";
import { useProjectData } from "entities/issue/api/use_project_data";
import IssueViewComponent from "modules/issues/components/issue/issue_view";
import type { FC } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, useAppSelector } from "shared/model";
import { useEventSubscriptionAutoReFetch } from "shared/model/api/events.api";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link, PageTitle } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { slugify } from "transliteration";

type IssueViewProps = {
    issueId: string;
};

const IssueView: FC<IssueViewProps> = ({ issueId }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { setAction } = useNavbarSettings();

    const { user } = useAppSelector((state) => state.profile);

    const {
        data: issueData,
        isLoading: isIssueLoading,
        error: issueError,
    } = issueApi.useGetIssueQuery(issueId, {
        refetchOnFocus: true,
    });

    const {
        project,
        isLoading: isProjectLoading,
        isEncrypted,
        encryptionKeys,
        error: projectError,
    } = useProjectData({ projectId: issueData?.payload.project.id });

    const isUserAddedToEncryption = useMemo(() => {
        if (!isEncrypted) return false;
        if (!user) return false;
        return !!encryptionKeys.some((key) => key.target_id === user.id);
    }, [encryptionKeys, isEncrypted, user]);

    const issue = issueData?.payload;

    const { updateIssue, updateIssueCache, isIssueUpdateLoading } =
        useIssueOperations({ issueId });

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            updateIssue({ ...formData });
        },
        [updateIssue],
    );

    useEventSubscriptionAutoReFetch({ ids: [issue?.id || ""] });

    useEffect(() => {
        if (issue && issue.id_readable && issue.id_readable !== issueId) {
            navigate({
                to: "/issues/$issueId/{-$subject}",
                params: {
                    issueId,
                    subject: slugify(issue.subject),
                },
                replace: true,
            });
        }
    }, [issue, issueId, navigate]);

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

    const error = issueError || projectError;
    const isLoading = isIssueLoading || isProjectLoading;

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
            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                issue && (
                    <>
                        <PageTitle
                            title={`${issue.id_readable}: ${issue.subject}`}
                        />

                        <IssueViewComponent
                            key={issue.id}
                            issue={issue}
                            project={project}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={updateIssueCache}
                            loading={isLoading || isIssueUpdateLoading}
                            isEncrypted={isEncrypted}
                            customFieldsErrors={issue.error_fields}
                            isUserAddedToEncryption={isUserAddedToEncryption}
                        />
                    </>
                )
            )}
        </Container>
    );
};

export { IssueView };
