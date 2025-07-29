import { CustomFieldsChipParser } from "features/custom_fields/custom_fields_chip_parser";
import type { FC } from "react";
import { useMemo } from "react";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type {
    CustomFieldWithValueT,
    IssueT,
    ProjectT,
} from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";

export type IssueCustomFieldChipsProps = {
    issue: IssueT;
    project?: ProjectT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<unknown>;
    onUpdateCache: (issueValue: Partial<IssueT>) => unknown;
};

export const IssueCustomFieldChips: FC<IssueCustomFieldChipsProps> = ({
    issue,
    project,
    onUpdateIssue,
    onUpdateCache,
}) => {
    const fields: CustomFieldWithValueT[] = useMemo(() => {
        const projectFields = project?.custom_fields || [];

        return projectFields.map((projectField) => {
            const targetIssueField = issue.fields[projectField.name];
            if (targetIssueField) return targetIssueField;
            return { ...projectField, value: null };
        });
    }, [issue, project]);

    const onFieldUpdate = (field: CustomFieldWithValueT) => {
        onUpdateIssue?.({
            fields: {
                ...fieldsToFieldValueMap(Object.values(issue.fields)),
                [field.name]: fieldToFieldValue(field),
            },
        });
        onUpdateCache?.({
            fields: {
                [field.name]: field,
            },
        });
    };

    return fields.map((field) => (
        <CustomFieldsChipParser
            field={field}
            onChange={onFieldUpdate}
            size="xsmall"
        />
    ));
};
