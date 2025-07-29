import CloseIcon from "@mui/icons-material/Close";
import type { SelectChangeEvent } from "@mui/material";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    debounce,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    TextField,
    Typography,
} from "@mui/material";
import { IssueLink } from "entities/issue/issue_link/issue_link";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "shared/model";
import type {
    IssueLinkTypeT,
    IssueT,
    ListQueryParams,
} from "shared/model/types";
import { linkTypes } from "shared/model/types";
import { QueryPagination } from "shared/ui";
import { useListQueryParams } from "shared/utils";

type IssueCardProps = {
    issue: IssueT;
    onSelect: (issue: IssueT) => void;
    selected: boolean;
};

const IssueCard: FC<IssueCardProps> = ({ issue, onSelect, selected }) => {
    return (
        <Box display="flex" alignItems="center" gap={1} fontSize={14}>
            <Checkbox
                sx={{ p: 0 }}
                checked={selected}
                onChange={() => onSelect(issue)}
            />

            <IssueLink
                issue={issue}
                resolved={issue.is_resolved}
                lineThrough={issue.is_resolved}
                flexShrink={0}
            >
                {issue.id_readable}
            </IssueLink>

            <IssueLink
                sx={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 1,
                    textOverflow: "ellipsis",
                }}
                issue={issue}
                title={issue.subject}
                resolved={issue.is_resolved}
            >
                {issue.subject}
            </IssueLink>
        </Box>
    );
};

const IssueCardSkeleton = () => {
    return (
        <Box display="flex" alignItems="center" gap={1} height="24px">
            <Box
                width="24px"
                height="24px"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Skeleton width="18px" height="18px" variant="rounded" />
            </Box>

            <Skeleton width="40px" height="18px" variant="rounded" />
            <Skeleton width="400px" height="18px" variant="rounded" />
        </Box>
    );
};

export type AddLinksProps = {
    issueId: string;
    onLinkIssues?: (data: {
        selectedIssues: string[];
        linkType: IssueLinkTypeT;
    }) => unknown;
    isLoading?: boolean;
    onCancel?: () => unknown;
};

const AddLinks: FC<AddLinksProps> = ({
    issueId,
    onLinkIssues,
    isLoading,
    onCancel,
}) => {
    const { t } = useTranslation();

    const [linkType, setLinkType] = useState<IssueLinkTypeT>("related");
    const [query, setQuery] = useState<string>("");
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

    const [listQueryParams, updateListQueryParams, resetListQueryParams] =
        useListQueryParams();

    const {
        data: issuesData,
        isLoading: isIssuesLoading,
        isFetching,
    } = issueApi.useListSelectLinkableIssuesQuery({
        id: issueId,
        params: listQueryParams,
    });

    const handleChangeLinkType = (event: SelectChangeEvent) => {
        setLinkType(event.target.value as IssueLinkTypeT);
    };

    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            updateListQueryParams((prev) => ({
                ...prev,
                search: searchValue.length > 0 ? searchValue : undefined,
                offset: 0,
            }));
        }, 300),
        [],
    );

    const handleSearchTextField = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    const handleClearSearchField = () => {
        setQuery("");
        resetListQueryParams();
    };

    const handleChangePagination = (params: Partial<ListQueryParams>) => {
        updateListQueryParams(params);
    };

    const handleSelectIssue = (issue: IssueT) => {
        setSelectedIssues((prev) => {
            if (prev.includes(issue.id_readable)) {
                return prev.filter((i) => i !== issue.id_readable);
            }
            return [...prev, issue.id_readable];
        });
    };

    const handleClickAddLink = () => {
        onLinkIssues?.({ selectedIssues, linkType });
    };

    const issues = issuesData?.payload.items || [];
    const issueCount = issuesData?.payload.count || 0;

    return (
        <Box
            display="flex"
            flexDirection="column"
            border={1}
            borderRadius={1}
            borderColor="divider"
        >
            <Box
                display="flex"
                alignItems="flex-start"
                flexDirection="column"
                gap={1}
                borderBottom={1}
                borderColor="divider"
                py={1}
                px={2}
            >
                <Typography fontWeight="bold" mb={1}>
                    {t("issues.links.add.title")}
                </Typography>

                <FormControl sx={{ width: "200px" }}>
                    <InputLabel id="issue-link-type">
                        {t("issues.links.type.select")}
                    </InputLabel>

                    <Select
                        labelId="issue-link-type"
                        id="issue-link-type"
                        value={linkType}
                        label={t("issues.links.type.select")}
                        onChange={handleChangeLinkType}
                        size="small"
                    >
                        {linkTypes.map((linkType) => (
                            <MenuItem
                                key={`link-type-${linkType}`}
                                value={linkType}
                            >
                                {t(`issues.links.type.${linkType}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label={t("issues.links.search.label")}
                    placeholder={t("issues.links.search.placeholder")}
                    value={query}
                    onChange={handleSearchTextField}
                    size="small"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Box display="flex" alignItems="center">
                                    {(isIssuesLoading || isFetching) && (
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                            sx={{ mr: 1 }}
                                        />
                                    )}

                                    {query && (
                                        <IconButton
                                            onClick={handleClearSearchField}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ),
                        },
                    }}
                    fullWidth
                />
            </Box>

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                py={1}
                px={2}
                maxHeight="216px"
                overflow="auto"
            >
                {isIssuesLoading || isFetching ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <IssueCardSkeleton key={index} />
                    ))
                ) : (
                    <>
                        {issues.length === 0 && (
                            <Typography color="text.secondary">
                                {t("issues.links.search.noResults")}
                            </Typography>
                        )}

                        {issues.map((issue) => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                onSelect={handleSelectIssue}
                                selected={selectedIssues.includes(
                                    issue.id_readable,
                                )}
                            />
                        ))}

                        <QueryPagination
                            count={issueCount}
                            queryParams={listQueryParams}
                            updateQueryParams={handleChangePagination}
                            size="small"
                        />
                    </>
                )}
            </Box>

            <Box
                display="flex"
                alignItems="center"
                gap={1}
                borderTop={1}
                borderColor="divider"
                py={1}
                px={2}
            >
                <Button
                    onClick={handleClickAddLink}
                    size="small"
                    variant="outlined"
                    loading={isLoading}
                    disabled={selectedIssues.length === 0}
                >
                    {t("issues.links.add")}
                </Button>

                <Button
                    onClick={onCancel}
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>
            </Box>
        </Box>
    );
};

export { AddLinks };
