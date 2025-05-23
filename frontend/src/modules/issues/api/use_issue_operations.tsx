import deepmerge from "deepmerge";
import { useCallback } from "react";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueT } from "shared/model/types";
import {
    decryptObject,
    encryptTextWithAES,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { useProjectData } from "./use_project_data";

export const useIssueOperations = (params: { issueId: string }) => {
    const { issueId } = params;

    const dispatch = useAppDispatch();

    const {
        data: issueData,
        isLoading: isIssueLoading,
        error: issueError,
    } = issueApi.useGetIssueQuery(issueId);

    const issue = issueData?.payload;

    const {
        isLoading: isProjectLoading,
        isDescriptionEncrypted,
        encryptionKeys,
        error: projectError,
    } = useProjectData({
        projectId: issue?.project.id,
    });

    const [updateIssue, { isLoading: isIssueUpdateLoading }] =
        issueApi.useUpdateIssueMutation();

    const processIssueText = useCallback(
        async (inputText: string) => {
            if (isDescriptionEncrypted && !!inputText) {
                const { text, key } = await encryptTextWithAES(inputText);
                const encryption = await wrapAESKey(key, encryptionKeys);

                return { value: text, encryption };
            }
            return { value: inputText };
        },
        [encryptionKeys, isDescriptionEncrypted],
    );

    const handleUpdateIssue = useCallback(
        async (params: Parameters<typeof updateIssue>[0]) => {
            const processedText = await processIssueText(
                params.text?.value || "",
            );

            return updateIssue({ ...params, text: processedText }).unwrap();
        },
        [processIssueText, updateIssue],
    );

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!issue) return;
            dispatch(
                issueApi.util.updateQueryData(
                    "getIssue",
                    issue.id_readable,
                    (draft) => {
                        draft.payload = deepmerge(draft.payload, issueValue, {
                            arrayMerge: (_, sourceArray) => sourceArray,
                        });
                    },
                ),
            );
        },
        [dispatch, issue],
    );

    const getIssueText = useCallback(async (issue: IssueT) => {
        if (!issue.text || !issue.text?.encryption) return issue.text?.value;
        return await decryptObject(issue.text);
    }, []);

    const isLoading = isIssueLoading || isProjectLoading;
    const error = issueError || projectError;

    return {
        updateIssue: handleUpdateIssue,
        updateIssueCache: handleUpdateCache,
        isIssueUpdateLoading,
        isLoading,
        error,
        getIssueText,
    };
};
