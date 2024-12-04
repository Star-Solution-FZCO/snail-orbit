import { Box, Stack } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { FilePreview } from "components";
import { ProjectField } from "features/custom_fields/project_field";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import { IssueT, UpdateIssueT } from "types";
import { AddLinks } from "./add_links";
import { CustomFieldsParser } from "./custom_fields_parser";
import { FieldContainer } from "./field_container";
import { IssueHeading } from "./heading";
import { IssueActivities } from "./issue_activities";
import { IssueAttachments } from "./issue_attachments";
import { IssueForm } from "./issue_form";
import { IssueLinks } from "./issue_links";

type IssueFormProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    isDraft?: boolean;
    loading?: boolean;
};

export const IssueView: FC<IssueFormProps> = ({
    issue,
    onUpdateIssue,
    onUpdateCache,
    onSaveIssue,
    loading,
    isDraft,
}) => {
    const { t } = useTranslation();

    const { data: projectData } = projectApi.useGetProjectQuery(
        issue?.project?.id ?? skipToken,
    );

    const [displayMode, setDisplayMode] = useState<"view" | "edit">("view");

    const issueId = issue.id_readable;

    return (
        <Box display="flex" alignItems="flex-start" gap={3}>
            <Stack direction="column" gap={2} flex={1}>
                {!isDraft && (
                    <IssueHeading
                        issue={issue}
                        displayMode={displayMode}
                        onChangeDisplayMode={setDisplayMode}
                    />
                )}

                <IssueForm
                    issue={issue}
                    mode={displayMode}
                    onUpdateIssue={onUpdateIssue}
                    onChangeDisplayMode={setDisplayMode}
                    onSaveIssue={onSaveIssue}
                    loading={loading}
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
