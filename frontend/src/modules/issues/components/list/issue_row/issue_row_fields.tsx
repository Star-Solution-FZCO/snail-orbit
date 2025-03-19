import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { memo, useCallback, useMemo } from "react";
import { projectApi } from "store";
import type { FieldValueT, IssueT, UpdateIssueT } from "types";
import { CustomFieldsChipParser } from "widgets/issue/custom_field_chip_parser/custom_field_chip_parser";
import { IssueRowFieldsContainer } from "./issue_row.styles";

type IssueRowFieldsProps = {
    issue: IssueT;
    onUpdateIssue?: (issue: { id: string } & UpdateIssueT) => unknown;
};

export const IssueRowFields: FC<IssueRowFieldsProps> = memo(
    ({ issue, onUpdateIssue }) => {
        const { project } = issue;

        const projectData = projectApi.useGetProjectQuery(
            project?.id || skipToken,
        );

        const availableFields = useMemo(() => {
            if (!projectData.data?.payload) return [];

            const { card_fields, custom_fields } = projectData.data.payload;
            const fieldsMap = new Map(
                custom_fields.map((field) => [field.id, field]),
            );
            return card_fields
                .map((id) => fieldsMap.get(id))
                .filter((el) => !!el);
        }, [projectData.data?.payload]);

        const handleUpdateIssue = useCallback(
            (fields: Record<string, FieldValueT>) => {
                onUpdateIssue?.({ id: issue.id, fields });
            },
            [issue.id, onUpdateIssue],
        );

        if (!project || !projectData.isSuccess) return null;

        return (
            <IssueRowFieldsContainer>
                <CustomFieldsChipParser
                    activeFields={issue.fields}
                    availableFields={availableFields}
                    onUpdateIssue={handleUpdateIssue}
                />
            </IssueRowFieldsContainer>
        );
    },
);
