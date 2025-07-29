import type { IssueT } from "shared/model/types";
import type { IssueLinkMode } from "shared/model/types/settings";
import {
    ISSUE_LINK_MODE_DEFAULT_VALUE,
    ISSUE_LINK_MODE_KEY,
} from "shared/model/types/settings";
import type { IssueLinkComponentProps } from "shared/ui/issue_link";
import { IssueLinkComponent } from "shared/ui/issue_link";
import { useLSState } from "shared/utils/helpers/local-storage";
import { slugify } from "transliteration";

type IssueLinkProps = {
    issue: Pick<IssueT, "id_readable" | "subject">;
} & Omit<IssueLinkComponentProps, "to" | "params" | "ref">;

export const IssueLink = (props: IssueLinkProps) => {
    const { issue, ...rest } = props;

    const [issueLinkMode] = useLSState<IssueLinkMode>(
        ISSUE_LINK_MODE_KEY,
        ISSUE_LINK_MODE_DEFAULT_VALUE,
    );

    return (
        <IssueLinkComponent
            to={
                issueLinkMode === "long"
                    ? "/issues/$issueId/$subject"
                    : "/issues/$issueId"
            }
            params={{
                issueId: issue.id_readable,
                subject:
                    issueLinkMode === "long"
                        ? slugify(issue.subject)
                        : undefined,
            }}
            {...rest}
        />
    );
};
