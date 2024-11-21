import { Box, Stack } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { FilePreview } from "components";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { IssueT, UpdateIssueT } from "types";
import { ProjectField } from "../../../features/custom_fields/project_field";
import { AddLinks } from "./add_links";
import { CustomFieldsParser } from "./custom_fields_parser";
import { FieldContainer } from "./field_container";
import { IssueActivities } from "./issue_activities";
import { IssueAttachments } from "./issue_attachments";
import { IssueData } from "./issue_data";
import { IssueLinks } from "./issue_links";

type IssueFormProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    loading?: boolean;
    isDraft?: boolean;
};

export const IssueView: FC<IssueFormProps> = ({
    issue,
    loading,
    onUpdateIssue,
    onUpdateCache,
    onSaveIssue,
    isDraft,
}) => {
    const { t } = useTranslation();

    const { data: projectData } = projectApi.useGetProjectQuery(
        issue?.project?.id ?? skipToken,
    );

    const issueId = issue.id_readable;

    return (
        <Box display="flex" alignItems="flex-start" gap={3}>
            <Stack direction="column" gap={2} flex={1}>
                <IssueData
                    issue={issue}
                    loading={loading}
                    onUpdateIssue={onUpdateIssue}
                    onSaveIssue={onSaveIssue}
                    isDraft={isDraft}
                />

                {!isDraft && (
                    <>
                        <AddLinks issueId={issueId} />

                        <IssueLinks
                            issueId={issueId}
                            links={issue.interlinks}
                        />
                    </>
                )}

                <IssueAttachments
                    issue={issue}
                    onUpdateIssue={onUpdateIssue}
                    onUpdateCache={onUpdateCache}
                />

                {!isDraft && <IssueActivities issueId={issueId} />}
            </Stack>

            <FieldContainer>
                <ProjectField
                    label={t("issues.form.project.label")}
                    value={issue?.project}
                    onChange={(project) => {
                        onUpdateIssue({ project_id: project.id });
                        onUpdateCache({ project });
                    }}
                />

                <CustomFieldsParser
                    fields={projectData?.payload.custom_fields || []}
                    issue={issue}
                    onUpdateIssue={onUpdateIssue}
                    onUpdateCache={onUpdateCache}
                />
            </FieldContainer>

            <FilePreview issue={issue} isDraft={isDraft} />
        </Box>
    );
};

export default IssueView;
