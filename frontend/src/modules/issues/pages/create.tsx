import { Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import IssueForm from "modules/issues/components/issue_form";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { CreateIssueT } from "types";
import { toastApiError } from "utils";

const IssueCreate: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [createIssue, { isLoading: isCreateProjectLoading }] =
        issueApi.useCreateIssuesMutation();

    const isLoading = isCreateProjectLoading;

    const handleSubmit = (formData: CreateIssueT) => {
        createIssue(formData)
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
                });
                toast.success(t("issues.create.success"));
            })
            .catch(toastApiError);
    };

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
            <Typography fontSize={24} fontWeight="bold">
                {t("issues.create.title")}
            </Typography>

            <IssueForm onSubmit={handleSubmit} loading={isLoading} />
        </Container>
    );
};

export { IssueCreate };
