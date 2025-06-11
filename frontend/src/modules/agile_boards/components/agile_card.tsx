import { LinearProgress } from "@mui/material";
import type { ComponentProps, FC } from "react";
import { memo, useMemo } from "react";
import { projectApi } from "shared/model";
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
import IssueCard from "shared/ui/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardHeader,
} from "shared/ui/agile/issue_card/issue_card.styles";
import { IssueLink } from "shared/ui/issue_link";
import { useIssueOperations } from "widgets/issue/api/use_issue_operations";
import { CustomFieldsChipParserV2 } from "widgets/issue/custom_fields_chip_parser/custom_fields_chip_parser";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: UiSettingT;
    cardFields: AgileBoardCardFieldT[];
    cardColorFields: AgileBoardCardFieldT[];
} & ComponentProps<typeof IssueCard>;

export const AgileCard: FC<IssueCardProps> = memo(
    ({ issue, cardSetting, cardColorFields, cardFields, ...props }) => {
        const { id_readable, subject } = issue;
        const { minCardHeight } = cardSetting;

        const { data: projectData, isLoading: isProjectLoading } =
            projectApi.useGetProjectQuery(issue.project.id);

        const { updateIssueCache, updateIssue, isLoading } = useIssueOperations(
            { issueId: id_readable },
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

        const fields: CustomFieldWithValueT[] = useMemo(() => {
            const projectFields = projectData?.payload.custom_fields || [];
            const cardFieldIds = new Set(cardFields.map((el) => el.gid));

            return projectFields
                .filter((field) => cardFieldIds.has(field.gid))
                .map((projectField) => {
                    const targetIssueField = issue.fields[projectField.name];
                    if (targetIssueField) return targetIssueField;
                    return { ...projectField, value: null };
                });
        }, [cardFields, issue.fields, projectData?.payload.custom_fields]);

        const onFieldUpdate = (field: CustomFieldWithValueT) => {
            updateIssue?.({
                fields: {
                    ...fieldsToFieldValueMap(Object.values(issue.fields)),
                    [field.name]: fieldToFieldValue(field),
                },
            });
            updateIssueCache?.({
                fields: {
                    [field.name]: field,
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
                    {isProjectLoading || isLoading ? <LinearProgress /> : null}
                    {projectData && !isProjectLoading && !isLoading ? (
                        <IssueCardBottom>
                            <CustomFieldsChipParserV2
                                fields={fields}
                                onChange={onFieldUpdate}
                            />
                        </IssueCardBottom>
                    ) : null}
                </IssueCardBody>
            </IssueCard>
        );
    },
);
