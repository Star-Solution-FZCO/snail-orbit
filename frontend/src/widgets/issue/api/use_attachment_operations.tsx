import { useCallback } from "react";
import type {
    IssueAttachmentBodyT,
    IssueAttachmentT,
} from "shared/model/types";
import {
    decryptBufferWithKey,
    encryptBufferWithKey,
    generateAES,
    getAESKeyFromMetas,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { downloadBlob } from "shared/utils/helpers/download-file";
import { downloadFileToVariable } from "shared/utils/helpers/download-file-to-variable";
import { makeFileUrl } from "shared/utils/helpers/make-file-url";
import { readFile } from "shared/utils/helpers/read-file";
import { useFileUploader } from "widgets/file_upload/useFileUploader";
import { useProjectData } from "./use_project_data";

export const useAttachmentOperations = (props: { projectId?: string }) => {
    const { projectId } = props;

    const { isLoading, isAttachmentsEncrypted, encryptionKeys } =
        useProjectData({
            projectId,
        });

    const { uploadFile } = useFileUploader();

    const uploadAttachment = useCallback(
        async (file: File): Promise<IssueAttachmentBodyT> => {
            if (!isAttachmentsEncrypted) {
                const id = await uploadFile(file, file.name);
                return { id };
            } else {
                const aesKey = await generateAES();
                const fileBuffer = await readFile(file);
                const fileEncrypted = await encryptBufferWithKey(
                    fileBuffer,
                    aesKey,
                );
                const encryption = await wrapAESKey(aesKey, encryptionKeys);
                const id = await uploadFile(
                    new Blob([fileEncrypted]),
                    file.name,
                );

                return { id, encryption };
            }
        },
        [encryptionKeys, isAttachmentsEncrypted, uploadFile],
    );

    const downloadAttachment = useCallback(
        async (attachment: IssueAttachmentT) => {
            const fileUrl = makeFileUrl(attachment.id);

            if (!isAttachmentsEncrypted || !attachment.encryption) {
                window.open(fileUrl, "_blank");
            } else {
                const file = await downloadFileToVariable(fileUrl);
                const key = await getAESKeyFromMetas(attachment.encryption);
                if (!key) return;
                const buffer = await file.arrayBuffer();
                const fileDecrypted = await decryptBufferWithKey(buffer, key);
                downloadBlob(new Blob([fileDecrypted]), attachment.name);
            }
        },
        [isAttachmentsEncrypted],
    );

    return {
        uploadAttachment,
        downloadAttachment,
        isLoading,
    };
};
