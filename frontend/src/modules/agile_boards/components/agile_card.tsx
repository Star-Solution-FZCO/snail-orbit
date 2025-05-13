import type { ComponentProps, FC } from "react";
import { memo, useCallback, useMemo } from "react";
import type {
    AgileBoardCardFieldT,
    CustomFieldValueT,
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
import { CustomFieldsChipParser } from "widgets/issue/custom_field_chip_parser/custom_field_chip_parser";

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

        const handleUpdateIssue = useCallback(
            (fields: Record<string, CustomFieldValueT>) =>
                onUpdateIssue(id_readable, { fields }),
            [id_readable, onUpdateIssue],
        );

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
                        <CustomFieldsChipParser
                            activeFields={issue.fields}
                            availableFields={cardFields}
                            onUpdateIssue={handleUpdateIssue}
                        />
                    </IssueCardBottom>
                </IssueCardBody>
            </IssueCard>
        );
    },
);
