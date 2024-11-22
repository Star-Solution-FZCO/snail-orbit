import IssueCard from "components/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "components/agile/issue_card/issue_card.styles";
import { Link } from "components/link";
import { ComponentProps, FC, memo, useCallback, useMemo } from "react";
import { AgileBoardCardFieldT, IssueT, UiSettingT, UpdateIssueT } from "types";
import { CustomFieldsParser } from "./custom_field_parser";

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
                        <Link to={`/issues/${id_readable}`}>{id_readable}</Link>
                        <span>{subject}</span>
                    </IssueCardHeader>
                    <IssueCardBottom>
                        <CustomFieldsParser
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
