import { Stack } from "@mui/material";
import { memo } from "react";
import { Tag } from "shared/ui/tag";
import { issueApi } from "shared/model";
import type { IssueT } from "shared/model/types";

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
                    key={id}
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
