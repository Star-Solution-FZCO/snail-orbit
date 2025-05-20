import { skipToken } from "@reduxjs/toolkit/query";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { issueApi, useAppDispatch } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { toastApiError } from "shared/utils";
import { useProjectData } from "../../api/use_project_data";
import { IssueModal } from "../../components/issue/issue_modal";
import type { ModalViewIssueProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";

export const ModalViewIssue: FC<ModalViewIssueProps> = (props) => {
    const { open, id, onClose } = props;

    const dispatch = useAppDispatch();

    const { data, isLoading, error } = issueApi.useGetIssueQuery(
        open && id ? id : skipToken,
    );

    const { isLoading: isProjectLoading } = useProjectData({
        projectId: data?.payload.project.id,
    });

    const [updateIssue, { isLoading: updateLoading }] =
        issueApi.useUpdateIssueMutation();

    const issue = data?.payload;

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

    const handleSubmit = useCallback(
        async (formData: IssueUpdate) => {
            await updateIssue({ ...formData, id })
                .unwrap()
                .catch(toastApiError);
        },
        [id, updateIssue],
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
            onUpdateCache={handleUpdateCache}
            loading={isLoading || updateLoading}
            open={open}
            onClose={onClose}
        />
    );
};
