import { ProjectField } from "features/custom_fields/project_field";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type { CustomFieldWithValueT } from "shared/model/types";
import { CustomFieldsParserV2 } from "widgets/issue/custom_fields_parser/custom_fields_parser";
import type { IssueCustomFieldsProps } from "./issue_custom_fields.types";

export const IssueCustomFields: FC<IssueCustomFieldsProps> = ({
    issue,
    project,
    onUpdateIssue,
    onUpdateCache,
    customFieldsErrors,
}) => {
    const { t } = useTranslation();

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
        <>
            <ProjectField
                label={t("issues.form.project.label")}
                value={issue.project}
                onChange={(project) => {
                    onUpdateIssue({ project_id: project.id });
                    onUpdateCache({ project });
                }}
            />

            <CustomFieldsParserV2
                fields={fields}
                onChange={onFieldUpdate}
                customFieldsErrors={customFieldsErrors}
            />
        </>
    );
};
