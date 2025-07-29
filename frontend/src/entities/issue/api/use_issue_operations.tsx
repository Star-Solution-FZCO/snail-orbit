import { skipToken } from "@reduxjs/toolkit/query";
import deepmerge from "deepmerge";
import { useCallback } from "react";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import {
    decryptObject,
    encryptTextWithAES,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { useProjectData } from "./use_project_data";

type Params = {
    issueId: string;
    issue?: IssueT;
};

export const useIssueOperations = (params: Params) => {
    const { issueId, issue: outerIssue } = params;

    const dispatch = useAppDispatch();

    const {
        data: issueData,
        isLoading: isIssueLoading,
        error: issueError,
    } = issueApi.useGetIssueQuery(outerIssue ? skipToken : issueId);

    const issue = outerIssue || issueData?.payload;

    const {
        isLoading: isProjectLoading,
        isDescriptionEncrypted,
        encryptionKeys,
        error: projectError,
    } = useProjectData({ projectId: issue?.project.id });

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
        async (params: IssueUpdate) => {
            if (params.text !== undefined)
                params.text = await processIssueText(params.text?.value || "");

            return updateIssue({ ...params, id: issueId })
                .unwrap()
                .catch((e) => {
                    toastApiError(e);
                    throw e;
                });
        },
        [issueId, processIssueText, updateIssue],
    );

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!issue) return;
            dispatch(
                issueApi.util.updateQueryData("getIssue", issueId, (draft) => {
                    draft.payload = deepmerge(draft.payload, issueValue, {
                        arrayMerge: (_, sourceArray) => sourceArray,
                    });
                }),
            );
        },
        [dispatch, issue, issueId],
    );

    const getIssueText = useCallback(async (issue: IssueT) => {
        if (!issue.text || !issue.text?.encryption) return issue.text?.value;
        return await decryptObject(issue.text);
    }, []);

    const isLoading = isIssueLoading || isProjectLoading;
    const error = issueError || projectError;

    return {
        issue,
        updateIssue: handleUpdateIssue,
        updateIssueCache: handleUpdateCache,
        isIssueUpdateLoading,
        isLoading,
        error,
        getIssueText,
    };
};
