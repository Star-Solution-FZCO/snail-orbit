import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "store";
import { CreateIssueT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import IssueForm from "../components/issue_form";
import { issueToIssueForm } from "../utils/issue_to_issue_form";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const { t } = useTranslation();
    const { issueId } = routeApi.useParams();

    const { data, isLoading, error, refetch } =
        issueApi.useGetIssuesQuery(issueId);

    const [updateIssue, { isLoading: isIssueUpdateLoading }] =
        issueApi.useUpdateIssuesMutation();

    const handleSubmit = (formData: CreateIssueT) => {
        updateIssue({ ...formData, id: issueId })
            .unwrap()
            .then(() => {
                toast.success(t("issue.update.success"));
            })
            .catch(toastApiError)
            .finally(refetch);
    };

    if (error) {
        return (
            <Container>
                <Typography fontSize={24} fontWeight="bold">
                    {formatErrorMessages(error) || t("issues.item.fetch.error")}
                </Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {isLoading ? (
                <Box display="flex" justifyContent="center">
                    <CircularProgress color="inherit" size={36} />
                </Box>
            ) : (
                <>
                    <Typography fontSize={24} fontWeight="bold">
                        {data?.payload.subject}
                    </Typography>

                    <IssueForm
                        onSubmit={handleSubmit}
                        loading={isLoading || isIssueUpdateLoading}
                        defaultValues={
                            data?.payload && issueToIssueForm(data.payload)
                        }
                    />
                </>
            )}
        </Container>
    );
};

export { IssueView };
