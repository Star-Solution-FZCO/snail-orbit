import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { LinearProgress, Tooltip, Typography } from "@mui/material";
import { useIssueOperations } from "entities/issue/api/use_issue_operations";
import { IssueLink } from "entities/issue/issue_link/issue_link";
import { CustomFieldsChipParser } from "features/custom_fields/custom_fields_chip_parser";
import type { ComponentProps, FC } from "react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import {
    fieldsToFieldValueMap,
    fieldToFieldValue,
} from "shared/model/mappers/issue";
import type {
    AgileBoardCardFieldT,
    CustomFieldWithValueT,
    IssueT,
} from "shared/model/types";
import IssueCard from "shared/ui/agile/issue_card/issue_card";
import {
    IssueCardBody,
    IssueCardBottom,
    IssueCardDescription,
    IssueCardHeader,
} from "shared/ui/agile/issue_card/issue_card.styles";
import { notEmpty } from "shared/utils/helpers/notEmpty";
import type { TotalAgileBoardViewSettings } from "./agile_board_view_settings/agile_board_view_settings.types";

export type IssueCardProps = {
    issue: IssueT;
    cardSetting: TotalAgileBoardViewSettings;
    cardFields: AgileBoardCardFieldT[];
    cardColorFields: AgileBoardCardFieldT[];
    onDoubleClick?: (issue: IssueT) => void;
} & Omit<ComponentProps<typeof IssueCard>, "onDoubleClick">;

export const AgileCard: FC<IssueCardProps> = memo(
    ({
        issue: outerIssue,
        cardSetting,
        cardColorFields,
        cardFields,
        onDoubleClick,
        ...props
    }) => {
        const { t } = useTranslation();
        const { id_readable, subject, project } = outerIssue;
        const { minCardHeight, showCustomFields, showDescription } =
            cardSetting;

        const { data: projectData, isLoading: isProjectLoading } =
            projectApi.useGetProjectQuery(project.id);

        const { updateIssueCache, updateIssue, isLoading, issue } =
            useIssueOperations({ issueId: id_readable, issue: outerIssue });

        const colors = useMemo(() => {
            return cardColorFields
                .map(({ name }) => issue?.fields[name])
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
            if (!issue) return [];
            const projectFields = projectData?.payload.custom_fields || [];
            const projectFieldMap = new Map(
                projectFields.map((el) => [el.gid, el]),
            );

            return cardFields
                .map((field) => {
                    const targetIssueField = issue.fields[field.name];
                    if (targetIssueField) return targetIssueField;
                    const projectField = projectFieldMap.get(field.gid);
                    if (!projectField) return null;
                    return { ...projectField, value: null };
                })
                .filter(notEmpty);
        }, [cardFields, issue, projectData?.payload.custom_fields]);

        const handleDoubleClick = () => {
            if (!issue) return;
            onDoubleClick?.(issue);
        };

        const onFieldUpdate = (field: CustomFieldWithValueT) => {
            if (!issue) return;
            updateIssue?.({
                fields: {
                    ...fieldsToFieldValueMap(Object.values(issue.fields)),
                    [field.name]: fieldToFieldValue(field),
                },
            }).catch(() => {
                handleDoubleClick();
            });
            updateIssueCache?.({
                fields: {
                    [field.name]: field,
                },
            });
        };

        const renderVisibility = () => {
            if (!issue?.has_custom_permissions) return null;

            const firstTarget = issue.permissions[0].target.name;
            const targets = issue.permissions
                .map((p) => p.target.name)
                .join(", ");
            const remainingCount = issue.permissions.length - 1;

            return (
                <Tooltip
                    title={t("issues.visibleTo", { targets })}
                    placement="top"
                >
                    <Typography
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        flexShrink={0}
                        fontSize="inherit"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                    >
                        <LockOutlinedIcon fontSize="inherit" color="disabled" />
                        {issue.permissions.length === 1
                            ? firstTarget
                            : `${firstTarget} +${remainingCount}`}
                    </Typography>
                </Tooltip>
            );
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
                onDoubleClick={handleDoubleClick}
                {...props}
            >
                <IssueCardBody>
                    <IssueCardHeader>
                        <IssueLink issue={outerIssue} flexShrink={0}>
                            {id_readable}
                        </IssueLink>
                        <span title={subject}>{subject}</span>
                    </IssueCardHeader>

                    {showDescription &&
                        issue &&
                        issue.text &&
                        !issue.text?.encryption?.length && (
                            <IssueCardDescription title={issue.text.value}>
                                {issue.text.value}
                            </IssueCardDescription>
                        )}

                    {isProjectLoading || isLoading ? <LinearProgress /> : null}

                    {projectData &&
                    !isProjectLoading &&
                    !isLoading &&
                    showCustomFields ? (
                        <IssueCardBottom>
                            {fields.map((field) => (
                                <CustomFieldsChipParser
                                    field={field}
                                    onChange={onFieldUpdate}
                                    size="xsmall"
                                    key={field.id}
                                />
                            ))}
                        </IssueCardBottom>
                    ) : null}

                    {renderVisibility()}
                </IssueCardBody>
            </IssueCard>
        );
    },
);
