import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { useRef } from "react";
import { toast, TypeOptions } from "react-toastify";
import {
    CommentT,
    CreateIssueT,
    CustomFieldT,
    FieldValueT,
    IssueActivityT,
    IssueActivityTypeT,
    IssueHistoryT,
    IssueT,
    SelectedAttachmentT,
} from "types";

export const initialSelectedAttachment: SelectedAttachmentT = {
    id: "",
    filename: "",
    type: "browser",
};

export const transformFields = (fields: CustomFieldT[]) =>
    fields.reduce(
        (prev, cur) => {
            if (!cur) return prev;
            if (cur.type === "user") prev[cur.name] = cur.value?.id;
            else if (cur.type === "user_multi")
                prev[cur.name] = cur.value?.map((el) => el.id);
            else if (cur.type === "enum") prev[cur.name] = cur.value?.value;
            else if (cur.type === "enum_multi")
                prev[cur.name] = cur.value?.map((el) => el.value);
            else if (cur.type === "state") prev[cur.name] = cur.value?.state;
            else prev[cur.name] = cur.value;
            return prev;
        },
        {} as Record<string, FieldValueT>,
    );

export const transformIssue = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue?.project?.id || "",
    fields: transformFields(Object.values(issue.fields)),
    attachments: issue.attachments.map((el) => el.id),
});

export const mergeActivityRecords = (
    comments: CommentT[],
    historyRecords: IssueHistoryT[],
    displayingActivities: IssueActivityTypeT[],
): IssueActivityT[] => {
    const commentActivities: IssueActivityT[] = comments.map((comment) => ({
        id: comment.id,
        type: "comment",
        time: comment.created_at,
        data: comment,
    }));

    const historyActivities: IssueActivityT[] = historyRecords.map(
        (record) => ({
            id: record.id,
            type: "history",
            time: record.time,
            data: record,
        }),
    );

    return [...commentActivities, ...historyActivities]
        .filter((activity) => displayingActivities.includes(activity.type))
        .sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
};

export const useUploadToast = () => {
    const toastId = useRef<Record<string, string | number | null>>({});
    const activeMutations = useRef<Record<string, any>>({});

    const handleCancelUpload = (fileName: string) => {
        if (activeMutations.current[fileName] && toastId.current[fileName]) {
            activeMutations.current[fileName].abort();
            toast.dismiss(toastId.current[fileName]);

            delete activeMutations.current[fileName];
            delete toastId.current[fileName];
        }
    };

    const showToast = (fileName: string) => {
        const id = toast(
            <Box display="flex" flexDirection="column" gap={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                >
                    <Typography>{fileName}</Typography>

                    <IconButton
                        sx={{ p: 0 }}
                        onClick={() => handleCancelUpload(fileName)}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <LinearProgress />
            </Box>,
            {
                closeOnClick: false,
                closeButton: false,
                hideProgressBar: true,
            },
        );

        toastId.current[fileName] = id;
    };

    const updateToast = (
        fileName: string,
        message: string,
        type: TypeOptions,
        autoClose: number,
    ) => {
        if (toastId.current[fileName]) {
            toast.update(toastId.current[fileName]!, {
                render: <Typography>{message}</Typography>,
                onClose: () => {
                    delete toastId.current[fileName];
                    delete activeMutations.current[fileName];
                },
                isLoading: false,
                autoClose,
                type,
            });
        }
    };

    return { toastId, showToast, updateToast, activeMutations };
};
