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
import { useEffect, useState } from "react";
import { projectApi } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { FilePreview } from "shared/ui";
import { AddLinks } from "./components/add_links";
import { FieldOffside } from "./components/field_offside";
import { IssueActivities } from "./components/issue_activities";
import { IssueAttachments } from "./components/issue_attachments";
import { IssueCustomFields } from "./components/issue_custom_fields";
import { IssueForm } from "./components/issue_form";
import { IssueHeading } from "./components/issue_heading";
import { IssueLinks } from "./components/issue_links";
import { IssueMeta } from "./components/issue_meta";
import { IssueSubscribeButton } from "./components/issue_subscribe_button";
import { IssueTags } from "./components/issue_tags";

type IssueModalProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    loading?: boolean;
    isDraft?: boolean;
    onClose?: () => void;
} & Pick<DialogProps, "open">;

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

    const { data: projectData } = projectApi.useGetProjectQuery(
        issue?.project?.id ?? skipToken,
    );

    const [displayMode, setDisplayMode] = useState<"view" | "edit">(
        isDraft ? "edit" : "view",
    );

    const handleChangeDisplayMode = () =>
        setDisplayMode((prev) => (prev === "view" ? "edit" : "view"));

    useEffect(() => {
        if (!open) setTimeout(() => setDisplayMode("view"), 200);
    }, [open]);

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
                                        hideSubscribeButton
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

                        {!isDraft && <IssueActivities issueId={issue.id} />}
                    </Stack>
                </Stack>

                <Stack sx={{ boxShadow: 5 }}>
                    <Stack
                        direction="row"
                        sx={(theme) => ({
                            backgroundColor: theme.palette.background.paper,
                            p: 1,
                            pl: 1.5,
                        })}
                        justifyContent="space-between"
                    >
                        <IssueSubscribeButton issue={issue} />

                        <IconButton size="small" onClick={onClose}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Divider />

                    <FieldOffside>
                        <IssueCustomFields
                            issue={issue}
                            project={projectData?.payload}
                            onUpdateIssue={onUpdateIssue}
                            onUpdateCache={onUpdateCache}
                        />
                    </FieldOffside>
                </Stack>

                <FilePreview issue={issue} isDraft={isDraft} />
            </DialogContent>
        </Dialog>
    );
};
