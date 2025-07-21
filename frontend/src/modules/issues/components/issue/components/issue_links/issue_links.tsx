import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import {
    Box,
    Collapse,
    Divider,
    IconButton,
    Link as MuiLink,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { issueApi } from "shared/model";
import type { IssueLinkT, IssueLinkTypeT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import type { AddLinksProps } from "./add_links";
import { AddLinks } from "./add_links";
import { IssueLinkCard } from "./issue_link_card";

const groupLinksByType = (links: IssueLinkT[]) => {
    return links.reduce<Record<IssueLinkTypeT, IssueLinkT[]>>(
        (acc, link) => {
            if (!acc[link.type]) {
                acc[link.type] = [];
            }
            acc[link.type].push(link);
            return acc;
        },
        {} as Record<IssueLinkTypeT, IssueLinkT[]>,
    );
};

type IssueLinksProps = {
    issueId: string;
    links: IssueLinkT[];
    isAddLinksOpened?: boolean;
    onIsLinksOpenedToggle?: (isOpened: boolean) => unknown;
};

const IssueLinks: FC<IssueLinksProps> = ({
    issueId,
    links,
    isAddLinksOpened,
    onIsLinksOpenedToggle,
}) => {
    const { t } = useTranslation();

    const [linksExpanded, setLinksExpanded] = useState(true);

    const [unlinkIssue] = issueApi.useUnlinkIssueMutation();
    const [linkIssue, { isLoading: linkIssueLoading }] =
        issueApi.useLinkIssueMutation();

    const handleClickRemoveLink = (linkId: string) => {
        unlinkIssue({
            id: issueId,
            interlink_id: linkId,
        })
            .unwrap()
            .catch(toastApiError);
    };

    const onLinkIssues: AddLinksProps["onLinkIssues"] = (data) => {
        const { selectedIssues, linkType } = data;
        if (selectedIssues.length === 0) return;

        linkIssue({
            id: issueId,
            target_issues: selectedIssues,
            type: linkType,
        })
            .unwrap()
            .then(() => {
                const message = `${selectedIssues.join(", ")} ${t("issues.links.linkedAs")} "${linkType}" ${t("issues.links.to")} ${issueId}`;
                toast.success(message);
            })
            .catch((error) => {
                toastApiError(error);
            });
    };

    const groupedLinks = groupLinksByType(links);

    return (
        <>
            {isAddLinksOpened && (
                <AddLinks
                    issueId={issueId}
                    onLinkIssues={onLinkIssues}
                    isLoading={linkIssueLoading}
                    onCancel={() => onIsLinksOpenedToggle?.(false)}
                />
            )}

            <Box display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" gap={0.5}>
                    <IconButton
                        sx={{ p: 0 }}
                        onClick={() => setLinksExpanded(!linksExpanded)}
                        size="small"
                    >
                        <ExpandMoreIcon
                            sx={{
                                transform: linksExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0)",
                                transition: "transform 0.2s",
                            }}
                            fontSize="small"
                        />
                    </IconButton>

                    <Box display="flex" gap={1} width={1}>
                        <Box display="flex" gap={2} overflow="auto" flex={1}>
                            {Object.entries(groupedLinks).map(
                                ([type, linkItems]) => (
                                    <Typography key={type} fontWeight="bold">
                                        {t(`issues.links.type.${type}`)}{" "}
                                        <Typography
                                            component="span"
                                            color="text.secondary"
                                        >
                                            {linkItems.length}
                                        </Typography>
                                    </Typography>
                                ),
                            )}
                        </Box>

                        {!isAddLinksOpened && (
                            <MuiLink
                                sx={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                                onClick={() => onIsLinksOpenedToggle?.(true)}
                            >
                                <LinkIcon />
                                {t("issues.links.add.title")}
                            </MuiLink>
                        )}
                    </Box>
                </Box>

                <Collapse in={linksExpanded}>
                    <Box display="flex" flexDirection="column" gap={1} mt={1}>
                        <Divider flexItem />

                        {Object.entries(groupedLinks).map(
                            ([type, linkItems]) => (
                                <Box
                                    key={type}
                                    display="flex"
                                    flexDirection="column"
                                >
                                    <Typography
                                        color="text.secondary"
                                        fontSize={10}
                                        fontWeight="bold"
                                        textTransform="uppercase"
                                        mb={0.5}
                                    >
                                        {t(`issues.links.type.${type}`)}
                                    </Typography>

                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        gap={0.5}
                                    >
                                        {linkItems.map((link) => (
                                            <IssueLinkCard
                                                key={link.id}
                                                issueId={issueId}
                                                link={link}
                                                onRemove={handleClickRemoveLink}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ),
                        )}
                    </Box>
                </Collapse>
            </Box>
        </>
    );
};

export { IssueLinks };
