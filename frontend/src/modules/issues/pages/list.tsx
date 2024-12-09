import { Search } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    CircularProgress,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link } from "components";
import { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { formatErrorMessages, useListQueryParams } from "utils";
import useDebouncedState from "utils/hooks/use-debounced-state";
import IssuesList from "../components/list/issues_list";

const IssueList: FC = () => {
    const { t } = useTranslation();

    const [debouncedSearch, setSearch, search] = useDebouncedState<string>("");

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
        q: debouncedSearch,
    });

    const { data, isFetching, error, isLoading } =
        issueApi.useListIssuesQuery(listQueryParams);

    useEffect(() => {
        updateListQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    const rows = data?.payload.items || [];

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap={2}
            height="100%"
            px={4}
            pb={4}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography fontSize={24} fontWeight="bold">
                        {t("issues.title")}
                    </Typography>

                    {error && (
                        <Typography color="error" fontSize={16}>
                            {formatErrorMessages(error) ||
                                t("issues.list.fetch.error")}
                            !
                        </Typography>
                    )}
                </Box>

                <Link to="/issues/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("issues.new")}
                    </Button>
                </Link>
            </Stack>

            <TextField
                fullWidth
                size="small"
                placeholder={t("placeholder.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                {isFetching ? (
                                    <CircularProgress size={14} />
                                ) : (
                                    <Search />
                                )}
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {isLoading ? <CircularProgress /> : <IssuesList issues={rows} />}
        </Box>
    );
};

export { IssueList };
