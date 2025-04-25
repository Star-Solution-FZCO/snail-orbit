import { skipToken } from "@reduxjs/toolkit/query";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi, useAppDispatch } from "store";
import type { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { IssueModal } from "../../components/issue/issue_modal";
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
        async (formData: UpdateIssueT) => {
            await updateDraft({ ...formData, id })
                .unwrap()
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [id, updateDraft],
    );

    const issue = data?.payload;

    const handleCreateIssue = useCallback(async () => {
        if (!issue?.project) {
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
    }, [createIssue, id, issue?.project, onClose, t]);

    const handleUpdateCache = useCallback(
        (issueValue: Partial<IssueT>) => {
            if (!issue) return;

            dispatch(
                issueApi.util.updateQueryData(
                    "getDraft",
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

    useEffect(() => {
        if (error) {
            toastApiError(error);
            onClose?.();
        }
    }, [error, onClose]);

    if (!issue && isLoading)
        return <ModalViewLoader open={open} onClose={onClose} />;

    if (!issue) return null;

    return (
        <IssueModal
            issue={issue}
            onUpdateIssue={handleSubmit}
            onUpdateCache={handleUpdateCache}
            onSaveIssue={handleCreateIssue}
            loading={isLoading || updateLoading || createLoading}
            open={open}
            onClose={onClose}
            isDraft
        />
    );
};
