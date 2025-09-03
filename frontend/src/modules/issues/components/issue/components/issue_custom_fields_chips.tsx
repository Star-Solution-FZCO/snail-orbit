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
    slots?: number;
};

export const IssueCustomFieldChips: FC<IssueCustomFieldChipsProps> = ({
    issue,
    project,
    onUpdateIssue,
    onUpdateCache,
    slots,
}) => {
    const fields: (CustomFieldWithValueT | null)[] = useMemo(() => {
        const projectFields = new Map(
            project?.custom_fields.map((el) => [el.id, el]),
        );
        const cardFields = project?.card_fields || [];

        const res = cardFields
            .map((cardField) => projectFields.get(cardField))
            .filter((el) => !!el)
            .map((projectField) => {
                const targetIssueField = issue.fields[projectField.name];
                if (targetIssueField) return targetIssueField;
                return { ...projectField, value: null };
            });

        if (!slots || slots <= 0) return res;
        if (res.length > slots) return res.slice(0, slots);
        return [...res, ...new Array(slots - res.length).map(() => null)];
    }, [issue, project, slots]);

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

    return fields.map((field) =>
        !field ? (
            <div />
        ) : (
            <CustomFieldsChipParser
                field={field}
                onChange={onFieldUpdate}
                size="xsmall"
                key={field.id}
            />
        ),
    );
};
