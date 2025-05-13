import { useCallback } from "react";
import { issueApi } from "shared/model";
import type {
    CommentT,
    IssueAttachmentBodyT,
    IssueAttachmentT,
} from "shared/model/types";
import {
    decryptBufferWithKey,
    decryptTextWithAES,
    encryptBufferWithKey,
    encryptTextWithAES,
    generateAES,
    getAESKeyFromMetas,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { useFileUploader } from "widgets/file_upload/useFileUploader";
import { API_URL, apiVersion } from "../../../app/config";
import { downloadBlob } from "../../../shared/utils/helpers/download-file";
import { downloadFileToVariable } from "../../../shared/utils/helpers/download-file-to-variable";
import { readFile } from "../../../shared/utils/helpers/read-file";
import { useIssueData } from "./use_issue_data";

type UseIssueCommentCreateMutationsProps = {
    issueId: string;
};

// TODO: Shit, rewrite
export const useIssueOperations = ({
    issueId,
}: UseIssueCommentCreateMutationsProps) => {
    const {
        isEncrypted,
        isLoading: isIssueDataLoading,
        encryptionKeys,
    } = useIssueData({
        issueId,
    });

    const { uploadFile } = useFileUploader();

    const [createComment, { isLoading: isCommentCreateLoading }] =
        issueApi.useCreateIssueCommentMutation();
    const [updateComment, { isLoading: isCommentUpdateLoading }] =
        issueApi.useUpdateIssueCommentMutation();

    const processCommentText = useCallback(
        async (inputText: string) => {
            if (isEncrypted) {
                const { text, key } = await encryptTextWithAES(inputText);
                const encryption = await wrapAESKey(key, encryptionKeys);

                return { text, encryption };
            }
            return { text: inputText };
        },
        [encryptionKeys, isEncrypted],
    );

    const handleCreateComment = useCallback(
        async (
            params: Parameters<typeof createComment>[0],
        ): Promise<ReturnType<typeof createComment>> => {
            const processedText = await processCommentText(params.text || "");

            return createComment({ ...params, ...processedText });
        },
        [processCommentText, createComment],
    );

    const handleUpdateComment = useCallback(
        async (
            params: Parameters<typeof updateComment>[0],
        ): Promise<ReturnType<typeof updateComment>> => {
            const processedText = await processCommentText(params.text || "");

            return updateComment({ ...params, ...processedText });
        },
        [processCommentText, updateComment],
    );

    const getCommentText = useCallback(
        async (comment: CommentT) => {
            if (!isEncrypted || !comment.text || !comment.encryption)
                return comment.text;
            const key = await getAESKeyFromMetas(comment.encryption);
            if (!key) return comment.text;
            const res = await decryptTextWithAES(comment.text, key);
            return res || comment.text;
        },
        [isEncrypted],
    );

    const uploadAttachment = useCallback(
        async (file: File): Promise<IssueAttachmentBodyT> => {
            if (!isEncrypted) {
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
        [encryptionKeys, isEncrypted, uploadFile],
    );

    const downloadAttachment = useCallback(
        async (attachment: IssueAttachmentT) => {
            const fileUrl = API_URL + apiVersion + "/files/" + attachment.id;

            if (!isEncrypted || !attachment.encryption) {
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
        [],
    );

    const isLoading = isIssueDataLoading;

    return {
        isLoading,
        isCommentCreateLoading,
        isCommentUpdateLoading,
        createComment: handleCreateComment,
        updateComment: handleUpdateComment,
        uploadAttachment,
        downloadAttachment,
        getCommentText,
    };
};
