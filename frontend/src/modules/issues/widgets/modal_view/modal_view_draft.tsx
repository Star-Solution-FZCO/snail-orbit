import { skipToken } from "@reduxjs/toolkit/query";
import { useDraftOperations } from "entities/issue/api/use_draft_operations";
import { useProjectData } from "entities/issue/api/use_project_data";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { DraftModal } from "../../components/issue/draft_modal";
import type { ModalViewDraftProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";
import { useIssueModalView } from "./use_modal_view";

export const ModalViewDraft: FC<ModalViewDraftProps> = (props) => {
    const { open, id, onClose } = props;

    const { t } = useTranslation();

    const { openIssueModal } = useIssueModalView();

    const { data, isLoading, error } = issueApi.useGetDraftQuery(
        open && id ? id : skipToken,
    );

    const { isLoading: isProjectDataLoading } = useProjectData({
        projectId: data?.payload.project?.id,
    });

    const [createIssue, { isLoading: createLoading }] =
        issueApi.useCreateIssueFromDraftMutation();

    const { updateDraft, updateDraftCache, isDraftUpdateLoading } =
        useDraftOperations({ draftId: id });

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateDraft({ ...formData, id }).catch((error) => {
                toastApiError(error);
                return Promise.reject(error);
            });
        },
        [id, updateDraft],
    );

    const draft = data?.payload;

    const handleCreateIssue = useCallback(
        async (openIssue: boolean = false) => {
            if (!draft?.project) {
                toast.error(t("issues.project.required"));
                throw new Error(t("issues.project.required"));
            }

            await createIssue(id)
                .unwrap()
                .then((res) => {
                    if (!openIssue) {
                        toast.success(
                            <span>
                                {t("issues.draft.issueCreateSuccessToast", {
                                    issue_id: res.payload.id_readable,
                                })}
                            </span>,
                            {
                                onClick: () =>
                                    openIssueModal(res.payload.id_readable),
                            },
                        );
                        onClose?.();
                    } else openIssueModal(res.payload.id_readable);
                })
                .catch((error) => {
                    toastApiError(error);
                    return Promise.reject(error);
                });
        },
        [draft?.project, createIssue, id, t, onClose, openIssueModal],
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
            onUpdateCache={updateDraftCache}
            onCreateIssue={handleCreateIssue}
            loading={
                isLoading ||
                isDraftUpdateLoading ||
                createLoading ||
                isProjectDataLoading
            }
            open={open}
            onClose={onClose}
        />
    );
};
