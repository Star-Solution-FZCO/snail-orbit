import { ProjectField } from "entities/projects/project_field";
import { CustomFieldsParser } from "features/custom_fields/custom_fields_parser";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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

export type IssueCustomFieldsProps = {
    issue: IssueT;
    project?: ProjectT;
    onUpdateIssue: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueT>) => void;
    customFieldsErrors?: Record<string, string>;
};

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

            {fields.map((field) => (
                <CustomFieldsParser
                    key={field.gid || field.id}
                    field={field}
                    onChange={onFieldUpdate}
                    customFieldsErrors={customFieldsErrors}
                />
            ))}
        </>
    );
};
