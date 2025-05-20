import type {
    IssueAttachmentBodyT,
    IssueAttachmentT,
    IssueDraftT,
} from "shared/model/types";
import type { IssueDraftUpdate } from "shared/model/types/backend-schema.gen";
import { AttachmentsList } from "./attachments_list";

type DraftAttachmentsProps = {
    draft: IssueDraftT;
    onUpdateDraft: (issueValues: IssueDraftUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueDraftT>) => void;
};

export const DraftAttachments = (props: DraftAttachmentsProps) => {
    const {
        draft: { attachments, project },
        onUpdateDraft,
        onUpdateCache,
    } = props;

    const handleDelete = async (attachmentToDelete: IssueAttachmentT) => {
        onUpdateCache({
            attachments: attachments.filter(
                (attachment) => attachment.id !== attachmentToDelete.id,
            ),
        });

        await onUpdateDraft({
            attachments: attachments.filter(
                (attachment) => attachment.id !== attachmentToDelete.id,
            ),
        });
    };

    const handleUpload = async (
        attachmentsToUpload: IssueAttachmentBodyT[],
    ) => {
        const newAttachments = [...attachments, ...attachmentsToUpload];

        await onUpdateDraft({
            attachments: newAttachments,
        });
    };

    return (
        <AttachmentsList
            projectId={project?.id}
            attachments={attachments}
            onDelete={handleDelete}
            onUpload={handleUpload}
        />
    );
};
