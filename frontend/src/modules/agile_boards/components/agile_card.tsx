import IssueCard from "components/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "components/agile/issue_card/issue_card.styles";
import { Link } from "components/link";
import { ComponentProps, FC, memo } from "react";
import { IssueT, UiSettingT } from "types";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: UiSettingT;
} & ComponentProps<typeof IssueCard>;

export const AgileCard: FC<IssueCardProps> = memo(
    ({
        issue: { id_readable, subject, fields },
        cardSetting: { minCardHeight },
        ...props
    }) => {
        console.log(fields);

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
                    <IssueCardBottom></IssueCardBottom>
                </IssueCardBody>
            </IssueCard>
        );
    },
);
