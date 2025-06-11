import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { useDraftOperations } from "widgets/issue/api/use_draft_operations";
import { useProjectData } from "widgets/issue/api/use_project_data";
import { DraftModal } from "../../components/issue/draft_modal";
import type { ModalViewDraftProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";

export const ModalViewDraft: FC<ModalViewDraftProps> = (props) => {
    const { open, id, onClose } = props;

    const { t } = useTranslation();

    const { data, isLoading, error } = issueApi.useGetDraftQuery(
        open && id ? id : skipToken,
    );

    const { isLoading: isProjectLoading } = useProjectData({
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

    useEffect(() => {
        if (error) {
            toastApiError(error);
            onClose?.();
        }
    }, [error, onClose]);

    if ((!draft && isLoading) || isProjectLoading)
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
                isProjectLoading
            }
            open={open}
            onClose={onClose}
        />
    );
};
