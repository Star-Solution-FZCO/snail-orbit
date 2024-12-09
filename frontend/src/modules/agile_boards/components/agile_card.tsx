import IssueCard from "components/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "components/agile/issue_card/issue_card.styles";
import { ComponentProps, FC, memo, useCallback, useMemo } from "react";
import { AgileBoardCardFieldT, IssueT, UiSettingT, UpdateIssueT } from "types";
import { IssueLink } from "../../../components/issue_link";
import { CustomFieldsChipParser } from "../../../widgets/issue/custom_field_chip_parser/custom_field_chip_parser";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: UiSettingT;
    cardFields: AgileBoardCardFieldT[];
    cardColorFields: AgileBoardCardFieldT[];
    onUpdateIssue: (
        issueId: string,
        issueValues: UpdateIssueT,
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
            (issueValues: UpdateIssueT) =>
                onUpdateIssue(id_readable, issueValues),
            [id_readable],
        );

        const colors = useMemo(() => {
            return cardColorFields
                .map(({ name }) => issue.fields[name])
                .map((field) =>
                    (field && field.type === "enum") || field.type === "state"
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
                        <IssueLink to={`/issues/${id_readable}`}>
                            {id_readable}
                        </IssueLink>
                        <span>{subject}</span>
                    </IssueCardHeader>
                    <IssueCardBottom>
                        <CustomFieldsChipParser
                            issue={issue}
                            fields={cardFields}
                            onUpdateIssue={handleUpdateIssue}
                        />
                    </IssueCardBottom>
                </IssueCardBody>
            </IssueCard>
        );
    },
);
