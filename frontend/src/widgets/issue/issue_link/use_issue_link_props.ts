import { useAppSelector } from "shared/model";
import type { IssueLinkFieldT, IssueT } from "shared/model/types";
import { slugify } from "transliteration";

export const useIssueLinkProps = (issue: IssueT | IssueLinkFieldT) => {
    const issueLinkMode = useAppSelector(
        (state) => state.shared.issueLinks.mode,
    );

    if (issueLinkMode === "short") {
        return {
            to: "/issues/$issueId" as const,
            params: {
                issueId: issue.id_readable,
            },
        };
    }

    return {
        to: "/issues/$issueId/$subject" as const,
        params: {
            issueId: issue.id_readable,
            subject: slugify(issue.subject),
        },
    };
};
