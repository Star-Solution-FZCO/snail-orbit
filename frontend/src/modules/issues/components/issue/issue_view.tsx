import { Box, Stack } from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import type { IssueT, ProjectT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { FilePreview } from "shared/ui";
import { AddLinks } from "./components/add_links";
import { FieldContainer } from "./components/field_container";
import { IssueActivities } from "./components/issue_activities";
import { IssueAttachments } from "./components/issue_attachments";
import { IssueCustomFields } from "./components/issue_custom_fields";
import { IssueForm } from "./components/issue_form";
import { IssueHeading } from "./components/issue_heading";
import { IssueLinks } from "./components/issue_links";
import { IssueMeta } from "./components/issue_meta";
import { IssueTags } from "./components/issue_tags";

type IssueFormProps = {
    issue: IssueT;
    project?: ProjectT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    loading?: boolean;
    isDraft?: boolean;
    isEncrypted?: boolean;
};

export const IssueView: FC<IssueFormProps> = (props) => {
    const {
        issue,
        project,
        onUpdateIssue,
        onUpdateCache,
        onSaveIssue,
        loading,
        isDraft,
        isEncrypted,
    } = props;

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
                                    isEncrypted={isEncrypted}
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

                {!isDraft && <IssueActivities issueId={issue.id} />}
            </Stack>

            <FieldContainer>
                <IssueCustomFields
                    issue={issue}
                    project={project}
                    onUpdateIssue={onUpdateIssue}
                    onUpdateCache={onUpdateCache}
                />
            </FieldContainer>

            <FilePreview issue={issue} isDraft={isDraft} />
        </Box>
    );
};

export default IssueView;
