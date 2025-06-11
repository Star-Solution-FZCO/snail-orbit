import type { FC } from "react";
import { useMemo } from "react";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type { CustomFieldWithValueT } from "shared/model/types";
import { CustomFieldsChipParserV2 } from "../custom_fields_chip_parser/custom_fields_chip_parser";
import type { IssueCustomFieldChipsProps } from "./issue_custom_fields_chips.types";

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

    return (
        <CustomFieldsChipParserV2 fields={fields} onChange={onFieldUpdate} />
    );
};
