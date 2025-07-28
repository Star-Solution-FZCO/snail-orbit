import { useEffect } from "react";
import { issueApi } from "shared/model";
import type {
    IssueAttachmentBodyT,
    IssueAttachmentT,
    IssueT,
} from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { useLightbox } from "shared/ui";
import { makeFileUrl } from "shared/utils/helpers/make-file-url";
import { AttachmentsList } from "./attachments_list";

type IssueAttachmentsProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
};

export const IssueAttachments = (props: IssueAttachmentsProps) => {
    const {
        issue: { id_readable, attachments, project },
        onUpdateIssue,
        onUpdateCache,
    } = props;

    const { data: comments } = issueApi.useListIssueCommentsQuery({
        id: id_readable,
    });

    const {
        load: loadLBFiles,
        clear: clearLBFiles,
        close: closeLB,
    } = useLightbox();

    const handleDelete = async (attachmentToDelete: IssueAttachmentT) => {
        onUpdateCache({
            attachments: attachments.filter(
                (attachment) => attachment.id !== attachmentToDelete.id,
            ),
        });

        await onUpdateIssue({
            attachments: attachments.filter(
                (attachment) => attachment.id !== attachmentToDelete.id,
            ),
        });
    };

    const handleUpload = async (
        attachmentsToUpload: IssueAttachmentBodyT[],
    ) => {
        const newAttachments = [...attachments, ...attachmentsToUpload];

        await onUpdateIssue({
            attachments: newAttachments,
        });
    };

    useEffect(() => {
        const issueAttachments = attachments.map((a) => ({
            id: a.id,
            src: makeFileUrl(a.id),
            name: a.name,
            size: a.size,
            content_type: a.content_type,
        }));

        const commentsAttachments =
            comments?.payload.items
                .flatMap((comment) => comment.attachments)
                .reverse()
                .map((a) => ({
                    id: a.id,
                    src: makeFileUrl(a.id),
                    name: a.name,
                    size: a.size,
                    content_type: a.content_type,
                })) || [];

        loadLBFiles([...issueAttachments, ...commentsAttachments]);

        return () => {
            closeLB();
            clearLBFiles();
        };
    }, [attachments, comments, loadLBFiles, closeLB, clearLBFiles]);

    return (
        <AttachmentsList
            projectId={project?.id}
            attachments={attachments}
            onDelete={handleDelete}
            onUpload={handleUpload}
        />
    );
};
