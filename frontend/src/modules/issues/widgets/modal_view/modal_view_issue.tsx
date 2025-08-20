import { skipToken } from "@reduxjs/toolkit/query";
import { useIssueOperations } from "entities/issue/api/use_issue_operations";
import { useProjectData } from "entities/issue/api/use_project_data";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { issueApi } from "shared/model";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { IssueModal } from "../../components/issue/issue_modal";
import type { ModalViewIssueProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";

export const ModalViewIssue: FC<ModalViewIssueProps> = (props) => {
    const { open, id, onClose } = props;

    const { data, isLoading, error } = issueApi.useGetIssueQuery(
        open && id ? id : skipToken,
        {
            refetchOnFocus: true,
        },
    );

    const issue = data?.payload;

    const { isLoading: isProjectLoading, isEncrypted } = useProjectData({
        projectId: issue?.project.id,
    });

    const { updateIssue, updateIssueCache, isIssueUpdateLoading } =
        useIssueOperations({ issueId: id });

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            updateIssue(formData);
        },
        [updateIssue],
    );

    useEffect(() => {
        if (error) {
            toastApiError(error);
            onClose?.();
        }
    }, [error, onClose]);

    if ((!issue && isLoading) || isProjectLoading)
        return <ModalViewLoader open={open} onClose={onClose} />;

    if (!issue) return null;

    return (
        <IssueModal
            issue={issue}
            onUpdateIssue={handleSubmit}
            onUpdateCache={updateIssueCache}
            loading={isLoading || isIssueUpdateLoading}
            open={open}
            onClose={onClose}
            isEncrypted={isEncrypted}
            customFieldsErrors={issue?.error_fields}
        />
    );
};
