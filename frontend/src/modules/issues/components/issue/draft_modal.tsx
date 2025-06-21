import { Close } from "@mui/icons-material";
import type { DialogProps } from "@mui/material";
import {
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Stack,
} from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { projectApi } from "shared/model";
import type { IssueDraftT } from "shared/model/types";
import type { IssueDraftUpdate } from "shared/model/types/backend-schema.gen";
import { DraftAttachments } from "./components/draft_attachments";
import { DraftCustomFields } from "./components/draft_custom_fields";
import { DraftForm } from "./components/draft_form";
import { FieldOffside } from "./components/field_offside";

type DraftModalProps = {
    draft: IssueDraftT;
    onUpdateDraft: (issueValues: IssueDraftUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueDraftT>) => void;
    onCreateIssue?: () => Promise<void>;
    loading?: boolean;
    onClose?: () => void;
} & Pick<DialogProps, "open">;

export const DraftModal: FC<DraftModalProps> = (props) => {
    const {
        open,
        onClose,
        draft,
        onCreateIssue,
        onUpdateDraft,
        onUpdateCache,
        loading,
    } = props;

    const { data: projectData } = projectApi.useGetProjectQuery(
        draft?.project?.id ?? skipToken,
    );
    return (
        <Dialog open={open} fullWidth maxWidth="lg">
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
                    <Stack
                        direction="column"
                        gap={2}
                        flex={1}
                        overflow="auto"
                        pt={1}
                        pb={2}
                        pr={2}
                    >
                        <DraftForm
                            draft={draft}
                            onUpdateDraft={onUpdateDraft}
                            onCreateIssue={onCreateIssue}
                            onCancel={onClose}
                            loading={loading}
                        />

                        <DraftAttachments
                            draft={draft}
                            onUpdateDraft={onUpdateDraft}
                            onUpdateCache={onUpdateCache}
                        />
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
                        <IconButton size="small" onClick={onClose}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Divider />

                    <FieldOffside>
                        <DraftCustomFields
                            draft={draft}
                            project={projectData?.payload}
                            onUpdateDraft={onUpdateDraft}
                            onUpdateCache={onUpdateCache}
                        />
                    </FieldOffside>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
