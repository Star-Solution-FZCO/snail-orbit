import { useEffect } from "react";
import { issueApi } from "shared/model";
import type {
    IssueAttachmentBodyT,
    IssueAttachmentT,
    IssueT,
} from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { useLightbox } from "shared/ui";
import { toastApiError } from "shared/utils";
import { AttachmentsList } from "./attachments_list";

type IssueAttachmentsProps = {
    issue: IssueT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
};

const emptyArr: unknown[] = [];

export const IssueAttachments = (props: IssueAttachmentsProps) => {
    const {
        issue: { id_readable, project },
    } = props;

    const { data: attachmentsResponse } = issueApi.useListIssueAttachmentQuery({
        id: id_readable,
    });

    const [batchCreateAttachments] =
        issueApi.useBatchCreateIssueAttachmentsMutation();
    const [batchDeleteAttachments] =
        issueApi.useBatchDeleteIssueAttachmentsMutation();

    const attachments = attachmentsResponse?.payload?.items || emptyArr;

    const {
        load: loadLBFiles,
        clear: clearLBFiles,
        close: closeLB,
    } = useLightbox();

    const handleDelete = async (attachmentsToDelete: IssueAttachmentT[]) => {
        const attachmentIds = attachmentsToDelete.map((a) => a.id);

        await batchDeleteAttachments({
            id: id_readable,
            attachmentIds,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const handleUpload = async (attachments: IssueAttachmentBodyT[]) => {
        await batchCreateAttachments({
            id: id_readable,
            attachments,
        })
            .unwrap()
            .catch(toastApiError);
    };

    useEffect(() => {
        const issueAttachments = attachments.map((a) => ({
            id: a.id,
            src: a.url,
            name: a.name,
            size: a.size,
            content_type: a.content_type,
        }));

        loadLBFiles(issueAttachments);

        return () => {
            closeLB();
            clearLBFiles();
        };
    }, [attachments, clearLBFiles, closeLB, loadLBFiles]);

    return (
        <AttachmentsList
            projectId={project?.id}
            attachments={attachments}
            onDelete={handleDelete}
            onUpload={handleUpload}
        />
    );
};
