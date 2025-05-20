import deepmerge from "deepmerge";
import { useCallback } from "react";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueDraftT } from "shared/model/types";
import {
    decryptObject,
    encryptTextWithAES,
    wrapAESKey,
} from "shared/utils/crypto/crypto";
import { useProjectData } from "./use_project_data";

export const useDraftOperations = (params: { draftId: string }) => {
    const { draftId } = params;

    const dispatch = useAppDispatch();

    const {
        data: draftData,
        isLoading: isDraftLoading,
        error: draftError,
    } = issueApi.useGetDraftQuery(draftId);

    const draft = draftData?.payload;

    const {
        isLoading: isProjectLoading,
        isEncrypted,
        encryptionKeys,
        error: projectError,
    } = useProjectData({
        projectId: draft?.project?.id,
    });

    const [updateDraft, { isLoading: isDraftUpdateLoading }] =
        issueApi.useUpdateDraftMutation();

    const processDraftText = useCallback(
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

    const handleUpdateDraft = useCallback(
        async (params: Parameters<typeof updateDraft>[0]) => {
            const processedText = await processDraftText(
                params.text?.value || "",
            );

            return updateDraft({ ...params, text: processedText }).unwrap();
        },
        [processDraftText, updateDraft],
    );

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueDraftT>) => {
            if (!draft) return;
            dispatch(
                issueApi.util.updateQueryData("getDraft", draft.id, (draft) => {
                    draft.payload = deepmerge(draft.payload, issueValue, {
                        arrayMerge: (_, sourceArray) => sourceArray,
                    });
                }),
            );
        },
        [dispatch, draft],
    );

    const getDraftText = useCallback(async (draft: IssueDraftT) => {
        if (!draft.text || !draft.text?.encryption) return draft.text?.value;
        return await decryptObject(draft.text);
    }, []);

    const isLoading = isDraftLoading || isProjectLoading;
    const error = draftError || projectError;

    return {
        updateDraft: handleUpdateDraft,
        updateDraftCache: handleUpdateCache,
        isDraftUpdateLoading,
        isLoading,
        error,
        getDraftText,
    };
};
