import { Close } from "@mui/icons-material";
import type { DialogProps } from "@mui/material";
import {
    Box,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Stack,
} from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { IssueT, UpdateIssueT } from "types";
import { FilePreview } from "../../../../components";
import { ProjectField } from "../../../../features/custom_fields/project_field";
import { projectApi } from "../../../../store";
import { CustomFieldsParser } from "../../../../widgets/issue/custom_fields_parser/custom_fields_parser";
import { AddLinks } from "./add_links";
import { FieldOffside } from "./field_offside";
import { IssueActivities } from "./issue_activities";
import { IssueAttachments } from "./issue_attachments";
import { IssueForm } from "./issue_form";
import { IssueHeading } from "./issue_heading";
import { IssueLinks } from "./issue_links";
import { IssueMeta } from "./issue_meta";
import { IssueTags } from "./issue_tags";

type IssueModalProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: UpdateIssueT) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    loading?: boolean;
    isDraft?: boolean;
} & Pick<DialogProps, "open" | "onClose">;

export const IssueModal: FC<IssueModalProps> = (props) => {
    const {
        open,
        onClose,
        issue,
        isDraft,
        onSaveIssue,
        onUpdateIssue,
        onUpdateCache,
        loading,
    } = props;
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <DialogContent
                sx={(theme) => ({
                    padding: 0,
                    backgroundColor: theme.palette.background.default,
                    display: "flex",
                    flexDirection: "row",
                    overflow: "hidden",
                })}
            >
                <Stack direction="column" gap={2} flex={1} pt={2} pl={2}>
                    {!isDraft && (
                        <Box pr={2}>
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

                    <Stack
                        direction="column"
                        gap={2}
                        flex={1}
                        overflow="auto"
                        pt={1}
                        pb={2}
                        pr={2}
                    >
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
                </Stack>

                <Stack sx={{ boxShadow: 5 }}>
                    <Stack
                        direction="row"
                        sx={(theme) => ({
                            backgroundColor: theme.palette.background.paper,
                            p: 1,
                        })}
                        justifyContent="flex-end"
                    >
                        <IconButton size="small">
                            <Close fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <FieldOffside>
                        <ProjectField
                            label={t("issues.form.project.label")}
                            value={issue?.project}
                            onChange={(project) => {
                                onUpdateIssue({ project_id: project.id });
                                onUpdateCache({ project });
                            }}
                        />

                        <CustomFieldsParser
                            availableFields={
                                projectData?.payload.custom_fields || []
                            }
                            activeFields={issue.fields}
                            onUpdateIssue={(fields) =>
                                onUpdateIssue({ fields })
                            }
                            onUpdateCache={(fields) =>
                                onUpdateCache({ fields })
                            }
                        />
                    </FieldOffside>
                </Stack>

                <FilePreview issue={issue} isDraft={isDraft} />
            </DialogContent>
        </Dialog>
    );
};
