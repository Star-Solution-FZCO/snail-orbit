import { skipToken } from "@reduxjs/toolkit/query";
import type { FC } from "react";
import { memo, useMemo } from "react";
import { projectApi } from "shared/model";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type { CustomFieldWithValueT, IssueT } from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import { CustomFieldsChipParserV2 } from "widgets/issue/custom_fields_chip_parser_v2/custom_fields_chip_parser_v2";
import { IssueRowFieldsContainer } from "./issue_row.styles";

type IssueRowFieldsProps = {
    issue: IssueT;
    onUpdateIssue?: (issue: IssueUpdate) => unknown;
};

export const IssueRowFields: FC<IssueRowFieldsProps> = memo(
    ({ issue, onUpdateIssue }) => {
        const { project } = issue;

        const projectData = projectApi.useGetProjectQuery(
            project?.id || skipToken,
        );

        const fields: CustomFieldWithValueT[] = useMemo(() => {
            const projectFields =
                projectData?.data?.payload.custom_fields || [];

            return projectFields.map((projectField) => {
                const targetIssueField = issue.fields[projectField.name];
                if (targetIssueField) return targetIssueField;
                return { ...projectField, value: null };
            });
        }, [issue.fields, projectData?.data?.payload.custom_fields]);

        const onFieldUpdate = (field: CustomFieldWithValueT) => {
            onUpdateIssue?.({
                fields: {
                    ...fieldsToFieldValueMap(Object.values(issue.fields)),
                    [field.name]: fieldToFieldValue(field),
                },
            });
        };

        if (!project || !projectData.isSuccess) return null;

        return (
            <IssueRowFieldsContainer>
                <CustomFieldsChipParserV2
                    fields={fields}
                    onChange={onFieldUpdate}
                />
            </IssueRowFieldsContainer>
        );
    },
);
