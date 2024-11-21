import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import deepmerge from "deepmerge";
import { FC, useCallback, useEffect } from "react";
import { issueApi, useAppDispatch } from "store";
import { slugify } from "transliteration";
import { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { IssueHeading } from "../components/heading";
import IssueViewComp from "../components/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const navigate = useNavigate();
    const { issueId } = routeApi.useParams();
    const dispatch = useAppDispatch();

    const { data, isLoading, error } = issueApi.useGetIssueQuery(issueId);

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const handleSubmit = useCallback(
        async (formData: UpdateIssueT) => {
            await updateIssue({ ...formData, id: issueId })
                .unwrap()
                .catch(toastApiError);
        },
        [issueId],
    );

    const issue = data?.payload;

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
                issue && (
                    <>
                        <IssueHeading issue={issue} />

                        <IssueViewComp
                            loading={isLoading || updateLoading}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            issue={issue}
                        />
                    </>
                )
            )}
        </Container>
    );
};

export { IssueView };
