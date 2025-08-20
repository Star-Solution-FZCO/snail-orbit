import { Stack } from "@mui/material";
import { memo } from "react";
import { issueApi } from "shared/model";
import type { IssueT } from "shared/model/types";
import { Link } from "shared/ui";
import { Tag } from "shared/ui/tag";

type IssueTagsProps = {
    issue: IssueT;
};

export const IssueTags = memo((props: IssueTagsProps) => {
    const { issue } = props;
    const { tags } = issue;

    const [untagIssue] = issueApi.useUntagIssueMutation();

    return (
        <Stack direction="row" gap={1} flexShrink={0}>
            {tags.map(({ name, color, id }) => (
                <Link
                    key={id}
                    to="/issues"
                    search={{ query: `tag: "${name}"` }}
                >
                    <Tag
                        color={color || ""}
                        label={name}
                        onDelete={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            untagIssue({
                                issueId: issue.id_readable,
                                tagId: id,
                            });
                        }}
                    />
                </Link>
            ))}
        </Stack>
    );
});

IssueTags.displayName = "IssueTags";
