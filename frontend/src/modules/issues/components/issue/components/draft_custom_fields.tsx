import { ProjectField } from "entities/custom_fields/project_field";
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
    IssueDraftT,
    ProjectT,
} from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";

type DraftCustomFieldsProps = {
    draft: IssueDraftT;
    project?: ProjectT;
    onUpdateDraft: (issueValues: IssueUpdate) => Promise<void>;
    onUpdateCache: (issueValue: Partial<IssueDraftT>) => void;
};

export const DraftCustomFields: FC<DraftCustomFieldsProps> = ({
    draft,
    project,
    onUpdateDraft,
    onUpdateCache,
}) => {
    const { t } = useTranslation();

    const fields: CustomFieldWithValueT[] = useMemo(() => {
        const projectFields = project?.custom_fields || [];

        return projectFields.map((projectField) => {
            const targetIssueField = draft.fields[projectField.name];
            if (targetIssueField) return targetIssueField;
            return { ...projectField, value: null };
        });
    }, [draft, project]);

    const onFieldUpdate = (field: CustomFieldWithValueT) => {
        onUpdateDraft?.({
            fields: {
                ...fieldsToFieldValueMap(Object.values(draft.fields)),
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
                value={draft.project || undefined}
                onChange={(project) => {
                    onUpdateDraft({ project_id: project.id });
                }}
            />

            {fields.map((field) => (
                <CustomFieldsParser field={field} onChange={onFieldUpdate} />
            ))}
        </>
    );
};
