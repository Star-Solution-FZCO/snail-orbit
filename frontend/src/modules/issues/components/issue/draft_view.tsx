import { Box, Stack } from "@mui/material";
import type { FC } from "react";
import type { IssueDraftT, ProjectT } from "shared/model/types";
import type { IssueDraftUpdate } from "shared/model/types/backend-schema.gen";
import { DraftAttachments } from "./components/draft_attachments";
import { DraftCustomFields } from "./components/draft_custom_fields";
import { DraftForm } from "./components/draft_form";
import { FieldContainer } from "./components/field_container";

type DraftViewProps = {
    draft: IssueDraftT;
    project?: ProjectT;
    onUpdateDraft: (issueValues: IssueDraftUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueDraftT>) => void;
    onCreateIssue?: () => Promise<void>;
    onGoBack?: () => void;
    loading?: boolean;
};

export const DraftView: FC<DraftViewProps> = (props) => {
    const {
        draft,
        project,
        onUpdateDraft,
        onUpdateCache,
        onCreateIssue,
        onGoBack,
        loading,
    } = props;

    return (
        <Box display="flex" alignItems="flex-start" gap={3}>
            <Stack direction="column" gap={2} flex={1}>
                <DraftForm
                    draft={draft}
                    loading={loading}
                    onUpdateDraft={onUpdateDraft}
                    onCreateIssue={onCreateIssue}
                    onCancel={onGoBack}
                />

                <DraftAttachments
                    draft={draft}
                    onUpdateDraft={onUpdateDraft}
                    onUpdateCache={onUpdateCache}
                />
            </Stack>

            <FieldContainer>
                <DraftCustomFields
                    draft={draft}
                    project={project}
                    onUpdateDraft={onUpdateDraft}
                    onUpdateCache={onUpdateCache}
                />
            </FieldContainer>
        </Box>
    );
};
