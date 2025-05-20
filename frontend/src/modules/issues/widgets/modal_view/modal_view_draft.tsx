import { skipToken } from "@reduxjs/toolkit/query";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueDraftT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { DraftModal } from "../../components/issue/draft_modal";
import type { ModalViewDraftProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";

export const ModalViewDraft: FC<ModalViewDraftProps> = (props) => {
    const { open, id, onClose } = props;

    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const { data, isLoading, error } = issueApi.useGetDraftQuery(
        open && id ? id : skipToken,
    );

    const [updateDraft, { isLoading: updateLoading }] =
        issueApi.useUpdateDraftMutation();

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id })
                .unwrap()
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [id, updateDraft],
    );

    const draft = data?.payload;

    const handleCreateIssue = useCallback(async () => {
        if (!draft?.project) {
            toast.error(t("issues.project.required"));
            throw new Error(t("issues.project.required"));
        }

        await createIssue(id)
            .unwrap()
            .then(onClose)
            .catch((error) => {
                toastApiError(error);
                return Promise.reject(error);
            });
    }, [createIssue, id, draft?.project, onClose, t]);

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

    useEffect(() => {
        if (error) {
            toastApiError(error);
            onClose?.();
        }
    }, [error, onClose]);

    if (!draft && isLoading)
        return <ModalViewLoader open={open} onClose={onClose} />;

    if (!draft) return null;

    return (
        <DraftModal
            draft={draft}
            onUpdateDraft={handleSubmit}
            onUpdateCache={handleUpdateCache}
            onCreateIssue={handleCreateIssue}
            loading={isLoading || updateLoading || createLoading}
            open={open}
            onClose={onClose}
        />
    );
};
