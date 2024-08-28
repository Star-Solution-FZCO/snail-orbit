import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { getRouteApi } from "@tanstack/react-router";
import { FC } from "react";
import { issueApi } from "store";
import { CreateIssueT } from "../../../types";
import IssueForm from "../components/issue_form";
import { issueToIssueForm } from "../utils/issue_to_issue_form";

const routeApi = getRouteApi("/_authenticated/issues/$issueId");

const IssueView: FC = () => {
    const { issueId } = routeApi.useParams();

    const { data, isLoading } = issueApi.useGetIssuesQuery(issueId);

    const handleSubmit = (formData: CreateIssueT) => {
        console.log(formData);
    };

    return (
        <Container
            maxWidth="lg"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "90dvh",
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Typography fontSize={24} fontWeight="bold">
                        {data?.payload.subject}
                    </Typography>

                    <IssueForm
                        onSubmit={handleSubmit}
                        loading={isLoading}
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
