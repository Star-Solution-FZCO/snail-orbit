import { skipToken } from "@reduxjs/toolkit/query";
import { FC, memo, useCallback, useMemo } from "react";
import { issueApi, projectApi } from "store";
import type { CreateIssueT, IssueT } from "types";
import { CustomFieldsChipParser } from "../../../../../widgets/issue/custom_field_chip_parser/custom_field_chip_parser";
import { IssueRowFieldsContainer } from "./issue_row.styles";

type IssueRowFieldsProps = {
    issue: IssueT;
};

export const IssueRowFields: FC<IssueRowFieldsProps> = memo(({ issue }) => {
    const { project } = issue;

    const projectData = projectApi.useGetProjectQuery(project?.id || skipToken);
    const [updateIssue] = issueApi.useUpdateIssueMutation();

    const availableFields = useMemo(() => {
        if (!projectData.data?.payload) return [];

        const { card_fields, custom_fields } = projectData.data.payload;
        const fieldsMap = new Map(
            custom_fields.map((field) => [field.id, field]),
        );
        return card_fields.map((id) => fieldsMap.get(id)).filter((el) => !!el);
    }, [projectData.data?.payload]);

    const handleUpdateIssue = useCallback(
        (data: Partial<CreateIssueT>) => {
            updateIssue({ id: issue.id, ...data });
        },
        [issue.id],
    );

    if (!project || !projectData.isSuccess) return null;

    return (
        <IssueRowFieldsContainer>
            <CustomFieldsChipParser
                issue={issue}
                fields={availableFields}
                onUpdateIssue={handleUpdateIssue}
            />
        </IssueRowFieldsContainer>
    );
});
