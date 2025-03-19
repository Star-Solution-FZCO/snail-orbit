import { Box, Stack } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { FilePreview } from "components";
import { ProjectField } from "features/custom_fields/project_field";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "store";
import type { IssueT, UpdateIssueT } from "types";
import { CustomFieldsParser } from "widgets/issue/custom_fields_parser/custom_fields_parser";
import { AddLinks } from "./components/add_links";
import { FieldContainer } from "./components/field_container";
import { IssueActivities } from "./components/issue_activities";
import { IssueAttachments } from "./components/issue_attachments";
import { IssueForm } from "./components/issue_form";
import { IssueHeading } from "./components/issue_heading";
import { IssueLinks } from "./components/issue_links";
import { IssueMeta } from "./components/issue_meta";
import { IssueTags } from "./components/issue_tags";

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

    const [displayMode, setDisplayMode] = useState<"view" | "edit">(
        isDraft ? "edit" : "view",
    );

    const handleChangeDisplayMode = () =>
        setDisplayMode((prev) => (prev === "view" ? "edit" : "view"));

    const issueId = issue.id_readable;

    return (
        <Box display="flex" alignItems="flex-start" gap={3}>
            <Stack direction="column" gap={2} flex={1}>
                {!isDraft && (
                    <Box display="flex" flexDirection="column" gap={2}>
                        <IssueMeta issue={issue} />

                        {displayMode === "view" && (
                            <Stack>
                                <IssueHeading
                                    issue={issue}
                                    onEditClick={handleChangeDisplayMode}
                                />
                                <IssueTags issue={issue} />
                            </Stack>
                        )}
                    </Box>
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
                    availableFields={projectData?.payload.custom_fields || []}
                    activeFields={issue.fields}
                    onUpdateIssue={(fields) => onUpdateIssue({ fields })}
                    onUpdateCache={(fields) => onUpdateCache({ fields })}
                />
            </FieldContainer>

            <FilePreview issue={issue} isDraft={isDraft} />
        </Box>
    );
};

export default IssueView;
