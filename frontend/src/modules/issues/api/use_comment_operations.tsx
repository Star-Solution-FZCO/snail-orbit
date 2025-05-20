import { useCallback } from "react";
import { issueApi } from "shared/model";
import type { CommentT } from "shared/model/types";
import {
    decryptObject,
    encryptTextWithAES,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { useProjectData } from "./use_project_data";

export const useCommentOperations = (props: { projectId?: string }) => {
    const { projectId } = props;

    const { isLoading, isEncrypted, encryptionKeys } = useProjectData({
        projectId,
    });

    const [createComment, { isLoading: isCommentCreateLoading }] =
        issueApi.useCreateIssueCommentMutation();
    const [updateComment, { isLoading: isCommentUpdateLoading }] =
        issueApi.useUpdateIssueCommentMutation();

    const processCommentText = useCallback(
        async (inputText: string) => {
            if (isEncrypted) {
                const { text, key } = await encryptTextWithAES(inputText);
                const encryption = await wrapAESKey(key, encryptionKeys);

                return { value: text, encryption };
            }
            return { value: inputText };
        },
        [encryptionKeys, isEncrypted],
    );

    const handleCreateComment = useCallback(
        async (
            params: Parameters<typeof createComment>[0],
        ): Promise<ReturnType<typeof createComment>> => {
            const processedText = await processCommentText(
                params.text?.value || "",
            );

            return createComment({ ...params, text: processedText });
        },
        [processCommentText, createComment],
    );

    const handleUpdateComment = useCallback(
        async (
            params: Parameters<typeof updateComment>[0],
        ): Promise<ReturnType<typeof updateComment>> => {
            const processedText = await processCommentText(
                params.text?.value || "",
            );

            return updateComment({ ...params, ...processedText });
        },
        [processCommentText, updateComment],
    );

    const getCommentText = useCallback(async (comment: CommentT) => {
        if (!comment.text || !comment.text?.encryption)
            return comment.text?.value;
        return await decryptObject(comment.text);
    }, []);

    return {
        isLoading,
        isCommentCreateLoading,
        isCommentUpdateLoading,
        createComment: handleCreateComment,
        updateComment: handleUpdateComment,
        getCommentText,
    };
};
