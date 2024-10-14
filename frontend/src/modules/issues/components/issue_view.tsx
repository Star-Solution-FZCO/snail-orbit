import { Box, Stack } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { IssueT, UpdateIssueT } from "types";
import { CustomFieldsParser } from "./custom_fields_parser";
import { FieldContainer } from "./field_container";
import { ProjectField } from "./fields/project_field";
import { IssueActivities } from "./issue_activities";
import { IssueAttachments } from "./issue_attachments";
import { IssueData } from "./issue_data";

type IssueFormProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    loading?: boolean;
};

export const IssueView: FC<IssueFormProps> = ({
    issue,
    loading,
    onUpdateIssue,
    onUpdateCache,
}) => {
    const { t } = useTranslation();

    const { data: projectData } = projectApi.useGetProjectQuery(
        issue?.project.id ?? skipToken,
    );

    return (
        <Box display="flex" alignItems="flex-start" gap={3}>
            <Stack direction="column" gap={2} flex={1}>
                <IssueData
                    issue={issue}
                    loading={loading}
                    onUpdateIssue={onUpdateIssue}
                />

                {issue && (
                    <IssueAttachments
                        issue={issue}
                        onUpdateIssue={onUpdateIssue}
                        onUpdateCache={onUpdateCache}
                    />
                )}

                {issue && <IssueActivities issueId={issue.id_readable} />}
            </Stack>

            <FieldContainer>
                <ProjectField
                    label={t("issues.form.project.label")}
                    value={issue.project.id}
                    onChange={(projectId) =>
                        onUpdateIssue({ project_id: projectId })
                    }
                />

                <CustomFieldsParser
                    fields={projectData?.payload.custom_fields || []}
                    issue={issue}
                    onUpdateIssue={onUpdateIssue}
                    onUpdateCache={onUpdateCache}
                />
            </FieldContainer>
        </Box>
    );
};

export default IssueView;
