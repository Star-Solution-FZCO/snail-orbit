import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { CreateIssueT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { IssueHeading } from "../components/heading";
import IssueForm from "../components/issue_form";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { issueId } = routeApi.useParams();

    const { data, isLoading, error, refetch } =
        issueApi.useGetIssueQuery(issueId);

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const handleSubmit = (formData: CreateIssueT) => {
        updateIssue({ ...formData, id: issueId })
            .unwrap()
            .then((response) => {
                const issueId = response.payload.id_readable;
                const subject = slugify(response.payload.subject);
                navigate({
                    to: "/issues/$issueId/$subject",
                    params: {
                        issueId,
                        subject,
                    },
                    replace: true,
                });
            })
            .catch(toastApiError)
            .finally(refetch);
    };

    const issue = data?.payload;

    useEffect(() => {
        if (issue && issue.id_readable && issue.id_readable !== issueId) {
            navigate({
                to: "/issues/$issueId/$subject",
                params: {
                    issueId: issue.id_readable,
                    subject: slugify(issue.subject),
                },
                replace: true,
            });
        }
    }, [issue]);

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
                    {issue && <IssueHeading issue={issue} />}

                    <IssueForm
                        onSubmit={handleSubmit}
                        loading={isLoading || updateLoading}
                        defaultValues={issue}
                        hideGoBack
                    />
                </>
            )}
        </Container>
    );
};

export { IssueView };
