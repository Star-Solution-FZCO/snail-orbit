import {
    CommentT,
    CreateIssueT,
    FieldValueT,
    IssueActivityT,
    IssueActivityTypeT,
    IssueHistoryT,
    IssueT,
} from "types";

export const transformIssue = (issue: IssueT): CreateIssueT => ({
    subject: issue.subject,
    text: issue.text,
    project_id: issue.project.id,
    fields: Object.keys(issue.fields).reduce(
        (prev, cur) => {
            if (!issue.fields[cur].value) return prev;
            if (issue.fields[cur].type === "user")
                prev[cur] = issue.fields[cur].value.id;
            else if (issue.fields[cur].type === "user_multi")
                prev[cur] = issue.fields[cur].value.map((el) => el.id);
            else prev[cur] = issue.fields[cur].value;
            return prev;
        },
        {} as Record<string, FieldValueT>,
    ),
    attachments: issue.attachments.map((el) => el.id),
});

export const mergeCommentsAndHistoryRecords = (
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
