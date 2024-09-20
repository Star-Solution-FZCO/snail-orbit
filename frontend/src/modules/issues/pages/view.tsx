import { TabContext, TabList } from "@mui/lab";
import {
    Box,
    CircularProgress,
    Container,
    Tab,
    Typography,
} from "@mui/material";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { TabPanel } from "components";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { CreateIssueT } from "types";
import { formatErrorMessages, toastApiError } from "utils";
import { IssueHeading } from "../components/heading";
import { IssueComments } from "../components/issue_comments";
import IssueForm from "../components/issue_form";
import { IssueHistory } from "../components/issue_history";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { issueId } = routeApi.useParams();

    const [currentTab, setCurrentTab] = useState<"comments" | "history">(
        "comments",
    );

    const { data, isLoading, error, refetch } =
        issueApi.useGetIssueQuery(issueId);

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const handleChangeTab = (
        _: React.SyntheticEvent,
        value: "comments" | "history",
    ) => {
        setCurrentTab(value);
    };

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

                    {/* TODO: change layout */}
                    <Box width="calc(100% - 324px)">
                        <TabContext value={currentTab}>
                            <Box borderBottom={1} borderColor="divider" mb={2}>
                                <TabList onChange={handleChangeTab}>
                                    <Tab
                                        label={t("issues.comments.title")}
                                        value="comments"
                                    />
                                    <Tab
                                        label={t("issues.history.title")}
                                        value="history"
                                    />
                                </TabList>
                            </Box>

                            <TabPanel value="comments">
                                <IssueComments issueId={issueId} />
                            </TabPanel>

                            <TabPanel value="history">
                                <IssueHistory issueId={issueId} />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </>
            )}
        </Container>
    );
};

export { IssueView };
