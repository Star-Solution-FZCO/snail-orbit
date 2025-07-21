import { useAppSelector } from "shared/model";
import type { IssueT } from "shared/model/types";
import type { IssueLinkComponentProps } from "shared/ui/issue_link";
import { IssueLinkComponent } from "shared/ui/issue_link";
import { slugify } from "transliteration";

type IssueLinkProps = {
    issue: Pick<IssueT, "id_readable" | "subject">;
} & Omit<IssueLinkComponentProps, "to" | "params" | "ref">;

export const IssueLink = (props: IssueLinkProps) => {
    const { issue, ...rest } = props;

    const issueLinkMode = useAppSelector(
        (state) => state.shared.issueLinks.mode,
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
