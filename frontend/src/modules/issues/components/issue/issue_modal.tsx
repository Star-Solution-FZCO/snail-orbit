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
import { IssueCustomFields } from "widgets/issue/issue_custom_fields/issue_custom_fields";
import { FieldOffside } from "./components/field_offside";
import { IssueActivities } from "./components/issue_activities/issue_activities";
import { IssueAttachments } from "./components/issue_attachments";
import { IssueForm } from "./components/issue_form";
import { IssueHeading } from "./components/issue_heading";
import { IssueLinks } from "./components/issue_links/issue_links";
import { IssueMeta } from "./components/issue_meta";
import { IssueSubscribeButton } from "./components/issue_subscribe_button";
import { IssueTags } from "./components/issue_tags";

type IssueModalProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    onSaveIssue?: () => Promise<void>;
    loading?: boolean;
    onClose?: () => void;
    isEncrypted?: boolean;
    customFieldsErrors?: Record<string, string>;
} & Pick<DialogProps, "open">;

export const IssueModal: FC<IssueModalProps> = (props) => {
    const {
        open,
        onClose,
        issue,
        onUpdateIssue,
        onUpdateCache,
        loading,
        isEncrypted,
        customFieldsErrors,
    } = props;

    const { data: projectData } = projectApi.useGetProjectQuery(
        issue?.project?.id ?? skipToken,
    );

    const [displayMode, setDisplayMode] = useState<"view" | "edit">("view");
    const [isLinksAddOpen, setIsLinksAddOpen] = useState<boolean>(false);

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
                    <Box pr={2}>
                        <IssueMeta issue={issue} />

                        {displayMode === "view" && (
                            <Stack>
                                <IssueHeading
                                    issue={issue}
                                    onEditClick={handleChangeDisplayMode}
                                    hideSubscribeButton
                                    isEncrypted={isEncrypted}
                                    onLinkClick={() =>
                                        setIsLinksAddOpen((prev) => !prev)
                                    }
                                />
                                <IssueTags issue={issue} />
                            </Stack>
                        )}
                    </Box>

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
                            loading={loading}
                        />

                        <IssueLinks
                            issueId={issueId}
                            links={issue.interlinks}
                            isAddLinksOpened={isLinksAddOpen}
                            onIsLinksOpenedToggle={setIsLinksAddOpen}
                        />

                        <IssueAttachments
                            issue={issue}
                            onUpdateIssue={onUpdateIssue}
                            onUpdateCache={onUpdateCache}
                        />

                        <IssueActivities issueId={issue.id_readable} />
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
                            customFieldsErrors={customFieldsErrors}
                        />
                    </FieldOffside>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
