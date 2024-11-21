import IssueCard from "components/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "components/agile/issue_card/issue_card.styles";
import { Link } from "components/link";
import { ComponentProps, FC, memo, useCallback } from "react";
import { AgileBoardCardFieldT, IssueT, UiSettingT, UpdateIssueT } from "types";
import { CustomFieldsParser } from "./custom_field_parser";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: UiSettingT;
    cardFields: AgileBoardCardFieldT[];
    onUpdateIssue: (
        issueId: string,
        issueValues: UpdateIssueT,
    ) => Promise<void> | void;
} & ComponentProps<typeof IssueCard>;

export const AgileCard: FC<IssueCardProps> = memo(
    ({ issue, cardSetting, cardFields, onUpdateIssue, ...props }) => {
        const { id_readable, subject } = issue;
        const { minCardHeight } = cardSetting;

        const handleUpdateIssue = useCallback(
            (issueValues: UpdateIssueT) =>
                onUpdateIssue(id_readable, issueValues),
            [id_readable],
        );

        return (
            <IssueCard
                sx={{
                    minHeight:
                        minCardHeight && Number.isSafeInteger(+minCardHeight)
                            ? `${+minCardHeight}px`
                            : 0,
                }}
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
