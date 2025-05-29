import type { ComponentProps, FC } from "react";
import { memo, useMemo } from "react";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type {
    AgileBoardCardFieldT,
    CustomFieldWithValueT,
    IssueT,
    UiSettingT,
} from "shared/model/types";
import type { IssueUpdate } from "shared/model/types/backend-schema.gen";
import IssueCard from "shared/ui/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "shared/ui/agile/issue_card/issue_card.styles";
import { IssueLink } from "shared/ui/issue_link";
import { CustomFieldsChipParserV2 } from "widgets/issue/custom_fields_chip_parser_v2/custom_fields_chip_parser_v2";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: UiSettingT;
    cardFields: AgileBoardCardFieldT[];
    cardColorFields: AgileBoardCardFieldT[];
    onUpdateIssue: (
        issueId: string,
        issueValues: IssueUpdate,
    ) => Promise<void> | void;
} & ComponentProps<typeof IssueCard>;

export const AgileCard: FC<IssueCardProps> = memo(
    ({
        issue,
        cardSetting,
        cardFields,
        onUpdateIssue,
        cardColorFields,
        ...props
    }) => {
        const { id_readable, subject } = issue;
        const { minCardHeight } = cardSetting;

        const colors = useMemo(() => {
            return cardColorFields
                .map(({ name }) => issue.fields[name])
                .map((field) =>
                    field &&
                    (field.type === "enum" || field.type === "state") &&
                    field.value
                        ? field.value.color
                        : "inherit",
                )
                .map((el) => el || "inherit");
        }, [cardColorFields, issue]);

        const fields: CustomFieldWithValueT[] = useMemo(() => {
            return cardFields.map((cardField) => {
                const targetIssueField = issue.fields[cardField.name];
                if (targetIssueField) return targetIssueField;
                return {
                    id: cardField.gid,
                    gid: cardField.gid,
                    type: cardField.type,
                    name: cardField.name,
                    value: null,
                };
            });
        }, [cardFields, issue.fields]);

        const onFieldUpdate = (field: CustomFieldWithValueT) => {
            onUpdateIssue?.(id_readable, {
                fields: {
                    ...fieldsToFieldValueMap(Object.values(issue.fields)),
                    [field.name]: fieldToFieldValue(field),
                },
            });
        };

        return (
            <IssueCard
                sx={{
                    minHeight:
                        minCardHeight && Number.isSafeInteger(+minCardHeight)
                            ? `${+minCardHeight}px`
                            : 0,
                }}
                colors={colors}
                {...props}
            >
                <IssueCardBody>
                    <IssueCardHeader>
                        <IssueLink
                            to="/issues/$issueId"
                            params={{ issueId: id_readable }}
                        >
                            {id_readable}
                        </IssueLink>
                        <span>{subject}</span>
                    </IssueCardHeader>
                    <IssueCardBottom>
                        <CustomFieldsChipParserV2
                            fields={fields}
                            onChange={onFieldUpdate}
                        />
                    </IssueCardBottom>
                </IssueCardBody>
            </IssueCard>
        );
    },
);
