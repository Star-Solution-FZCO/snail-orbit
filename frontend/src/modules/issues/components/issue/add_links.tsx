import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Skeleton,
    TextField,
    Typography,
} from "@mui/material";
import { Link, QueryPagination } from "components";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
    closeIssueLinks,
    issueApi,
    useAppDispatch,
    useAppSelector,
} from "store";
import { slugify } from "transliteration";
import { IssueLinkTypeT, IssueT, linkTypes, ListQueryParams } from "types";
import { toastApiError, useListQueryParams } from "utils";

interface IIssueCardProps {
    issue: IssueT;
    onSelect: (issue: IssueT) => void;
    selected: boolean;
}

const IssueCard: FC<IIssueCardProps> = ({ issue, onSelect, selected }) => {
    return (
        <Box display="flex" alignItems="center" gap={1} fontSize={14}>
            <Checkbox
                sx={{ p: 0 }}
                checked={selected}
                onChange={() => onSelect(issue)}
            />

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

interface IAddLinksProps {
    issueId: string;
}

const limit = 10;
const initialQueryParams = {
    limit,
    offset: 0,
};

const AddLinks: FC<IAddLinksProps> = ({ issueId }) => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const open = useAppSelector((state) => state.shared.issueLinks.open);

    const [linkType, setLinkType] = useState<IssueLinkTypeT>("related");
    const [query, setQuery] = useState<string>("");
    const [selectedIssue, setSelectedIssue] = useState<IssueT | null>(null);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        ...initialQueryParams,
        q: query,
    });

    const [fetchIssues, { data: issuesData, isLoading, isFetching }] =
        issueApi.useLazyListIssuesQuery();
    const [linkIssue, { isLoading: linkIssueLoading }] =
        issueApi.useLinkIssueMutation();

    const handleChangeLinkType = (event: SelectChangeEvent) => {
        setLinkType(event.target.value as IssueLinkTypeT);
    };

    const handleSearch = useCallback(() => {
        const newParams = {
            ...initialQueryParams,
            q: query,
        };
        updateListQueryParams(newParams);
        fetchIssues(newParams).unwrap().catch(toastApiError);
    }, [query]);

    const handleKeyDownSearchField = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
                handleSearch();
            }
        },
        [handleSearch],
    );

    const handleClearSearchField = () => {
        setQuery("");
        const newParams = {
            ...initialQueryParams,
            q: undefined,
        };
        updateListQueryParams(newParams);
        fetchIssues(newParams).unwrap().catch(toastApiError);
    };

    const handleChangePagination = (params: Partial<ListQueryParams>) => {
        updateListQueryParams(params);
        fetchIssues(
            {
                ...listQueryParams,
                ...params,
            },
            true,
        );
    };

    const handleSelectIssue = (issue: IssueT) => {
        setSelectedIssue(selectedIssue?.id === issue.id ? null : issue);
    };

    const handleClickAddLink = () => {
        if (!selectedIssue) return;

        linkIssue({
            id: issueId,
            target_issue: selectedIssue.id,
            type: linkType,
        })
            .unwrap()
            .then(() => {
                dispatch(closeIssueLinks());
                updateListQueryParams({ offset: 0, q: "" });
                setQuery("");
                setSelectedIssue(null);
                const message = `${selectedIssue.id_readable} ${t("issues.links.linkedAs")} "${linkType}" ${t("issues.links.to")} ${issueId}`;
                toast.success(message);
            })
            .catch((error) => {
                toastApiError(error);
            });
    };

    const handleClickCancel = () => {
        dispatch(closeIssueLinks());
        updateListQueryParams({ offset: 0, q: "" });
        setQuery("");
        setSelectedIssue(null);
    };

    const issues = issuesData?.payload.items || [];
    const issueCount = issuesData?.payload.count || 0;

    useEffect(() => {
        if (open) {
            fetchIssues(initialQueryParams).unwrap().catch(toastApiError);
        }
        return () => {
            open && dispatch(closeIssueLinks());
        };
    }, [open]);

    if (!open) return null;

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
                            <MenuItem value={linkType}>
                                {t(`issues.links.type.${linkType}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label={t("issues.links.search.label")}
                    placeholder={t("issues.links.search.placeholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDownSearchField}
                    size="small"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    mr="-14px"
                                >
                                    {(isLoading || isFetching) && (
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

                                    <Divider orientation="vertical" flexItem />

                                    <IconButton
                                        onClick={handleSearch}
                                        // disabled={!query}
                                    >
                                        <SearchIcon />
                                    </IconButton>
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
                {isLoading || isFetching ? (
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
                                selected={selectedIssue?.id === issue.id}
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
                <LoadingButton
                    onClick={handleClickAddLink}
                    size="small"
                    variant="outlined"
                    loading={linkIssueLoading}
                    disabled={!selectedIssue}
                >
                    {t("issues.links.add")}
                </LoadingButton>

                <Button
                    onClick={handleClickCancel}
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={linkIssueLoading}
                >
                    {t("cancel")}
                </Button>
            </Box>
        </Box>
    );
};

export { AddLinks };
