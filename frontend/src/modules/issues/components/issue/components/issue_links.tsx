import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
    Box,
    Collapse,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Link as MuiLink,
    Typography,
} from "@mui/material";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
    issueApi,
    toggleIssueLinks,
    useAppDispatch,
    useAppSelector,
} from "shared/model";
import type { IssueLinkT, IssueLinkTypeT } from "shared/model/types";
import { linkTypes } from "shared/model/types";
import { IssueLink } from "shared/ui/issue_link";
import { toastApiError } from "shared/utils";
import { useIssueLinkProps } from "widgets/issue/issue_link/use_issue_link_props";

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
    issueId: string;
    link: IssueLinkT;
    onRemove: (linkId: string) => void;
}

const IssueLinkCard: FC<IIssueLinkCardProps> = ({
    issueId,
    link,
    onRemove,
}) => {
    const { t } = useTranslation();

    const { issue, id, type } = link;

    const issueLinkProps = useIssueLinkProps(issue);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [updateIssueLink] = issueApi.useUpdateIssueLinkMutation();

    const handleClickChangeLinkType = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleClickLinkType = (linkType: IssueLinkTypeT) => {
        updateIssueLink({
            id: issueId,
            interlink_id: id,
            type: linkType,
        })
            .unwrap()
            .then(() => {
                handleCloseMenu();
                toast.success(t("issues.links.changeType.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
                px: 0.5,
                py: 0.25,
                borderRadius: 1,
                "&:hover": {
                    backgroundColor: "action.hover",
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
                <IssueLink
                    {...issueLinkProps}
                    resolved={issue.is_resolved}
                    lineThrough={issue.is_resolved}
                >
                    {issue.id_readable}
                </IssueLink>

                <IssueLink {...issueLinkProps} resolved={issue.is_resolved}>
                    {issue.subject}
                </IssueLink>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                    onClick={handleClickChangeLinkType}
                    size="small"
                    color="info"
                >
                    <ChangeCircleIcon />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleCloseMenu}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                >
                    {linkTypes
                        .filter((linkType) => linkType !== type)
                        .map((linkType) => (
                            <MenuItem
                                key={linkType}
                                value={linkType}
                                onClick={() => handleClickLinkType(linkType)}
                            >
                                {t(`issues.links.type.${linkType}`)}
                            </MenuItem>
                        ))}
                </Menu>

                <IconButton
                    onClick={() => onRemove(id)}
                    size="small"
                    color="error"
                >
                    <LinkOffIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

interface IIssueLinksProps {
    issueId: string;
    links: IssueLinkT[];
}

const IssueLinks: FC<IIssueLinksProps> = ({ issueId, links }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const addLinksComponentClosed = useAppSelector(
        (state) => !state.shared.issueLinks.open,
    );

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

                    {addLinksComponentClosed && (
                        <MuiLink
                            sx={{
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                            onClick={() => dispatch(toggleIssueLinks())}
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
                                        issueId={issueId}
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
