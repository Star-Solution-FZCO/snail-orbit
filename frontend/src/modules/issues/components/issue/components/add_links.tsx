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
import { Link, QueryPagination } from "components";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
    closeIssueLinks,
    issueApi,
    useAppDispatch,
    useAppSelector,
} from "store";
import { slugify } from "transliteration";
import type { IssueLinkTypeT, IssueT, ListQueryParams } from "types";
import { linkTypes } from "types";
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
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        ...initialQueryParams,
        q: query,
    });

    const [fetchIssues, { data: issuesData, isLoading, isFetching }] =
        issueApi.useLazyListSelectLinkableIssuesQuery();
    const [linkIssue, { isLoading: linkIssueLoading }] =
        issueApi.useLinkIssueMutation();

    const handleChangeLinkType = (event: SelectChangeEvent) => {
        setLinkType(event.target.value as IssueLinkTypeT);
    };

    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            const newParams =
                searchValue.length > 0
                    ? {
                          ...initialQueryParams,
                          search: searchValue,
                      }
                    : initialQueryParams;
            updateListQueryParams(newParams);
            fetchIssues({ id: issueId, params: newParams })
                .unwrap()
                .catch(toastApiError);
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
        updateListQueryParams(initialQueryParams);
        fetchIssues({ id: issueId, params: initialQueryParams })
            .unwrap()
            .catch(toastApiError);
    };

    const handleChangePagination = (params: Partial<ListQueryParams>) => {
        updateListQueryParams(params);
        const newParams = {
            ...listQueryParams,
            ...params,
        };
        fetchIssues(
            {
                id: issueId,
                params: newParams,
            },
            true,
        );
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
        if (selectedIssues.length === 0) return;

        linkIssue({
            id: issueId,
            target_issues: selectedIssues,
            type: linkType,
        })
            .unwrap()
            .then(() => {
                dispatch(closeIssueLinks());
                updateListQueryParams({ offset: 0, q: "" });
                setQuery("");
                setSelectedIssues([]);
                const message = `${selectedIssues.join(", ")} ${t("issues.links.linkedAs")} "${linkType}" ${t("issues.links.to")} ${issueId}`;
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
        setSelectedIssues([]);
    };

    const issues = issuesData?.payload.items || [];
    const issueCount = issuesData?.payload.count || 0;

    useEffect(() => {
        if (open) {
            fetchIssues({ id: issueId, params: initialQueryParams })
                .unwrap()
                .catch(toastApiError);
        }
        return () => {
            open && dispatch(closeIssueLinks());
        };
    }, [open, issueId]);

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
                    onChange={handleSearchTextField}
                    size="small"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Box display="flex" alignItems="center">
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
                    loading={linkIssueLoading}
                    disabled={selectedIssues.length === 0}
                >
                    {t("issues.links.add")}
                </Button>

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
