import { Stack } from "@mui/material";
import { Tag } from "components/tag";
import { memo } from "react";
import { issueApi } from "store";
import type { IssueT } from "types";

type IssueTagsProps = {
    issue: IssueT;
};

export const IssueTags = memo((props: IssueTagsProps) => {
    const { issue } = props;
    const { tags } = issue;

    const [untagIssue] = issueApi.useUntagIssueMutation();

    return (
        <Stack direction="row" gap={1}>
            {tags.map(({ name, color, id }) => (
                <Tag
                    color={color}
                    label={name}
                    onDelete={() =>
                        untagIssue({ issueId: issue.id_readable, tagId: id })
                    }
                />
            ))}
        </Stack>
    );
});

IssueTags.displayName = "IssueTags";
