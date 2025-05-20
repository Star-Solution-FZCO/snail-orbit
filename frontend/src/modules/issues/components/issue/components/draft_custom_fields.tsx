import { ProjectField } from "features/custom_fields/project_field";
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
import { CustomFieldsParserV2 } from "widgets/issue/custom_fields_parser_v2/custom_fields_parser_v2";

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

            <CustomFieldsParserV2 fields={fields} onChange={onFieldUpdate} />
        </>
    );
};
