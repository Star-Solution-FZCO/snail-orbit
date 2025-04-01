import { StarButton } from "components";
import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import type { IssueT } from "types";

type IssueSubscribeButtonProps = {
    issue: IssueT;
};

export const IssueSubscribeButton: FC<IssueSubscribeButtonProps> = ({
    issue,
}) => {
    const { t } = useTranslation();

    const [subscribe] = issueApi.useSubscribeIssueMutation();
    const [unsubscribe] = issueApi.useUnsubscribeIssueMutation();

    const handleToggle = useCallback(() => {
        const mutation = issue.is_subscribed ? unsubscribe : subscribe;
        mutation(issue.id_readable);
    }, [issue.id_readable, issue.is_subscribed, subscribe, unsubscribe]);

    return (
        <StarButton
            starred={issue.is_subscribed}
            onClick={handleToggle}
            size="small"
            tooltip={
                issue.is_subscribed
                    ? t("issues.unsubscribe")
                    : t("issues.subscribe")
            }
            sx={{ p: 0 }}
        />
    );
};
