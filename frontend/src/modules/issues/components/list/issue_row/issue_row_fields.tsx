import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { memo } from "react";
import { projectApi } from "shared/model";
import type { IssueT } from "shared/model/types";
import { useIssueOperations } from "widgets/issue/api/use_issue_operations";
import { IssueCustomFieldChips } from "widgets/issue/issue_custom_field_chips/issue_custom_fields_chips";
import { IssueRowFieldsContainer } from "./issue_row.styles";

type IssueRowFieldsProps = {
    issue: IssueT;
};

export const IssueRowFields: FC<IssueRowFieldsProps> = memo(({ issue }) => {
    const { project, id_readable } = issue;

    const { updateIssue, updateIssueCache, isLoading } = useIssueOperations({
        issueId: id_readable,
    });

    const projectData = projectApi.useGetProjectQuery(project?.id || skipToken);

    if (
        !project ||
        !projectData.isSuccess ||
        !projectData.data.payload ||
        isLoading
    )
        return null;

    return (
        <IssueRowFieldsContainer>
            <IssueCustomFieldChips
                issue={issue}
                project={projectData.data.payload}
                onUpdateIssue={updateIssue}
                onUpdateCache={updateIssueCache}
            />
        </IssueRowFieldsContainer>
    );
});
