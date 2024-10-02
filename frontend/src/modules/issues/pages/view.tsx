import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import { FC, useCallback, useEffect } from "react";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { IssueHeading } from "../components/heading";
import IssueForm from "../components/issue_form";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const navigate = useNavigate();
    const { issueId } = routeApi.useParams();

    const { data, isLoading, error, refetch } =
        issueApi.useGetIssueQuery(issueId);

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const handleSubmit = useCallback(
        (formData: UpdateIssueT) => {
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
        },
        [issueId, refetch, navigate],
    );

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
