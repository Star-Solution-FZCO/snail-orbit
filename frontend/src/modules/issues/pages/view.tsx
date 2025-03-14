import AddIcon from "@mui/icons-material/Add";
import { Box, CircularProgress, Container } from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, Link, PageTitle } from "components";
import { NavbarActionButton } from "components/navbar/navbar_action_button";
import { useNavbarSettings } from "components/navbar/navbar_settings";
import deepmerge from "deepmerge";
import { FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { issueApi, useAppDispatch } from "store";
import { slugify } from "transliteration";
import { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { IssueModal } from "../components/issue/issue_modal";
import IssueViewComponent from "../components/issue/issue_view";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { issueId } = routeApi.useParams();
    const dispatch = useAppDispatch();
    const { setAction } = useNavbarSettings();

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
                    issueId,
                    subject: slugify(issue.subject),
                },
                replace: true,
            });
        }
    }, [issue]);

    useEffect(() => {
        setAction(
            <Link to="/issues/create">
                <NavbarActionButton startIcon={<AddIcon />}>
                    {t("issues.new")}
                </NavbarActionButton>
            </Link>,
        );

        return () => setAction(null);
    }, [setAction]);

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
                            title={`${issue.id_readable} : ${issue.subject}`}
                        />

                        <IssueViewComponent
                            issue={issue}
                            onUpdateIssue={handleSubmit}
                            onUpdateCache={handleUpdateCache}
                            loading={isLoading || updateLoading}
                        />
                    </>
                )
            )}

            {issue && (
                <IssueModal
                    open
                    issue={issue}
                    onUpdateIssue={handleSubmit}
                    onUpdateCache={handleUpdateCache}
                />
            )}
        </Container>
    );
};

export { IssueView };
