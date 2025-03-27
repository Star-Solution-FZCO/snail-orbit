import { SubscribeButton } from "components";
import type { FC } from "react";
import { issueApi } from "store";
import { IssueT } from "types";

export const IssueSubscribeButton: FC<{ issue: IssueT }> = ({ issue }) => {
    const [subscribe] = issueApi.useSubscribeIssueMutation();
    const [unsubscribe] = issueApi.useUnsubscribeIssueMutation();

    const handleToggle = () => {
        const mutation = issue.is_subscribed ? unsubscribe : subscribe;
        mutation(issue.id_readable);
    };

    return (
        <SubscribeButton
            isSubscribed={issue.is_subscribed}
            onToggle={handleToggle}
            type="issue"
        />
    );
};
