import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Box,
    Button,
    Collapse,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import { Link } from "components";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { IssueLinkT, IssueLinkTypeT } from "types";
import { toastApiError } from "utils";

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

interface IIssueLinkCardProps {
    link: IssueLinkT;
    onRemove: (linkId: string) => void;
}

const IssueLinkCard: FC<IIssueLinkCardProps> = ({ link, onRemove }) => {
    const { t } = useTranslation();

    const { issue, id } = link;

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
                px: 1,
                py: 0.5,
                "&:hover": {
                    backgroundColor: "action.hover",
                    "& .remove-btn": {
                        display: "block",
                    },
                },
            }}
        >
            <Box
                display="flex"
                alignItems="center"
                gap={1}
                minHeight="32px"
                fontSize={14}
            >
                <Link
                    to="/issues/$issueId/$subject"
                    params={{
                        issueId: issue.id_readable,
                        subject: slugify(issue.subject),
                    }}
                >
                    {issue.id_readable}
                </Link>

                <Link
                    to="/issues/$issueId/$subject"
                    params={{
                        issueId: issue.id_readable,
                        subject: slugify(issue.subject),
                    }}
                >
                    {issue.subject}
                </Link>
            </Box>

            <Button
                className="remove-btn"
                sx={{
                    display: "none",
                    height: "32px",
                }}
                onClick={() => onRemove(id)}
                variant="outlined"
                size="small"
                color="info"
            >
                {t("issues.links.remove")}
            </Button>
        </Box>
    );
};

interface IIssueLinksProps {
    issueId: string;
    links: IssueLinkT[];
}

const IssueLinks: FC<IIssueLinksProps> = ({ issueId, links }) => {
    const { t } = useTranslation();

    const [linksExpanded, setLinksExpanded] = useState(true);

    const [unlinkIssue] = issueApi.useUnlinkIssueMutation();

    const handleClickRemoveLink = (linkId: string) => {
        unlinkIssue({
            id: issueId,
            interlink_id: linkId,
        })
            .unwrap()
            .catch(toastApiError);
    };

    if (links.length === 0) return null;

    const groupedLinks = groupLinksByType(links);

    return (
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

                <Box display="flex" gap={2} overflow="auto">
                    {Object.entries(groupedLinks).map(([type, linkItems]) => (
                        <Typography fontWeight="bold">
                            {t(`issues.links.type.${type}`)}{" "}
                            <Typography component="span" color="text.secondary">
                                {linkItems.length}
                            </Typography>
                        </Typography>
                    ))}
                </Box>
            </Box>

            <Collapse in={linksExpanded}>
                <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    <Divider flexItem />

                    {Object.entries(groupedLinks).map(([type, linkItems]) => (
                        <Box key={type} display="flex" flexDirection="column">
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
                                        link={link}
                                        onRemove={handleClickRemoveLink}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

export { IssueLinks };
