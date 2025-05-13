import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, useAppDispatch } from "shared/model";
import { useEventSubscriptionAutoReFetch } from "shared/model/api/events.api";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { ErrorHandler, Link, PageTitle } from "shared/ui";
import { NavbarActionButton } from "shared/ui/navbar/navbar_action_button";
import { useNavbarSettings } from "shared/ui/navbar/navbar_settings";
import { toastApiError } from "shared/utils";
import { slugify } from "transliteration";
import { useIssueData } from "../api/use_issue_data";
import IssueViewComponent from "../components/issue/issue_view";

type IssueViewProps = {
    issueId: string;
};

const IssueView: FC<IssueViewProps> = ({ issueId }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { setAction } = useNavbarSettings();

    const { issue, project, error, isEncrypted, isLoading } = useIssueData({
        issueId,
    });

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateIssue({ ...formData, id: issueId })
                .unwrap()
                .catch(toastApiError);
        },
        [issueId, updateIssue],
    );

    useEventSubscriptionAutoReFetch({ ids: [issue?.id || ""] });

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!issue) return;
            dispatch(
                issueApi.util.updateQueryData(
                    "getIssue",
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
        if (issue && issue.id_readable && issue.id_readable !== issueId) {
            navigate({
                to: "/issues/$issueId/$subject",
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
                issue && (
                    <>
                        <PageTitle
                            title={`${issue.id_readable}: ${issue.subject}`}
                        />

                        <IssueViewComponent
                            issue={issue}
                            project={project}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            loading={isLoading || updateLoading}
                            isEncrypted={isEncrypted}
                        />
                    </>
                )
            )}
        </Container>
    );
};

export { IssueView };
