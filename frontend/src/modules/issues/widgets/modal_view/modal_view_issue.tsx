import { skipToken } from "@reduxjs/toolkit/query";
import deepmerge from "deepmerge";
import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { issueApi, useAppDispatch } from "store";
import type { IssueT, UpdateIssueT } from "types";
import { toastApiError } from "utils";
import { IssueModal } from "../../components/issue/issue_modal";
import type { ModalViewIssueProps } from "./modal_view.types";
import { ModalViewLoader } from "./modal_view_loader";

export const ModalViewIssue: FC<ModalViewIssueProps> = (props) => {
    const { open, id, onClose } = props;

    const dispatch = useAppDispatch();

    const { data, isLoading, error } = issueApi.useGetIssueQuery(
        open && id ? id : skipToken,
    );

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
        async (formData: UpdateIssueT) => {
            await updateIssue({ ...formData, id })
                .unwrap()
                .catch(toastApiError);
        },
        [id],
    );

    useEffect(() => {
        if (error) {
            toastApiError(error);
            onClose?.();
        }
    }, [error]);

    if (!issue && isLoading)
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
