import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import deepmerge from "deepmerge";
import { FC, useCallback, useEffect, useState } from "react";
import { issueApi, useAppDispatch } from "store";
import { slugify } from "transliteration";
import { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import IssueViewComp from "../components/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const navigate = useNavigate();
    const { issueId } = routeApi.useParams();
    const dispatch = useAppDispatch();

    const [displayMode, setDisplayMode] = useState<"view" | "edit">("view");

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
                    <IssueViewComp
                        issue={issue}
                        displayMode={displayMode}
                        onUpdateIssue={handleSubmit}
                        onUpdateCache={handleUpdateCache}
                        onChangeDisplayMode={setDisplayMode}
                        loading={isLoading || updateLoading}
                    />
                )
            )}
        </Container>
    );
};

export { IssueView };
