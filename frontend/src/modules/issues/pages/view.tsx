import {
    Box,
    CircularProgress,
    Container,
    Divider,
    Typography,
} from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "store";
import { CreateIssueT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { IssueComments } from "../components/issue_comments";
import IssueForm from "../components/issue_form";
import { issueToIssueForm } from "../utils/issue_to_issue_form";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const { t } = useTranslation();
    const { issueId } = routeApi.useParams();

    const {
        data: issue,
        isLoading: issueLoading,
        error: issueError,
        refetch,
    } = issueApi.useGetIssuesQuery(issueId);

    const {
        data: comments,
        isLoading: commentsLoading,
        error: commentsError,
    } = issueApi.useListIssueCommentsQuery({
        id: issueId,
    });

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssuesMutation();

    const handleSubmit = (formData: CreateIssueT) => {
        updateIssue({ ...formData, id: issueId })
            .unwrap()
            .then(() => {
                toast.success(t("issues.update.success"));
            })
            .catch(toastApiError)
            .finally(refetch);
    };

    if (issueError || commentsError) {
        return (
            <Container>
                <Typography fontSize={24} fontWeight="bold">
                    {formatErrorMessages(issueError) ||
                        formatErrorMessages(commentsError) ||
                        t("issues.item.fetch.error")}
                </Typography>
            </Container>
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
            {issueLoading || commentsLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                <>
                    <Typography fontSize={24} fontWeight="bold">
                        {issue?.payload.subject}
                    </Typography>

                    <IssueForm
                        onSubmit={handleSubmit}
                        loading={issueLoading || updateLoading}
                        defaultValues={
                            issue?.payload && issueToIssueForm(issue.payload)
                        }
                        hideGoBack
                    />

                    {/* TODO: change layout */}
                    <Box width="calc(100% - 324px)">
                        <Divider sx={{ mb: 2 }} />

                        <IssueComments
                            issueId={issueId}
                            comments={comments?.payload.items || []}
                        />
                    </Box>
                </>
            )}
        </Container>
    );
};

export { IssueView };
