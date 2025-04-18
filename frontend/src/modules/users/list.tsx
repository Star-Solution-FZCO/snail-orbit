import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    CircularProgress,
    debounce,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridSortModel,
} from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, UserAvatar } from "components";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "store";
import { ListQueryParams, UserT } from "types";
import { useListQueryParams } from "utils";

const initialQueryParams = {
    limit: 50,
    offset: 0,
    sort_by: "name",
};

export const UserList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [query, setQuery] = useState<string>("");

    const [listQueryParams, updateListQueryParams, resetQueryParams] =
        useListQueryParams<ListQueryParams>(initialQueryParams);

    const { data, isLoading, isFetching, error } =
        userApi.useListUserQuery(listQueryParams);

    const columns: GridColDef<UserT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("users.fields.name"),
                flex: 1,
                renderCell: ({ row }) => (
                    <Box display="flex" alignItems="center" gap={1} height={1}>
                        <UserAvatar src={row.avatar} />
                        <Typography fontSize="inherit">{row.name}</Typography>
                    </Box>
                ),
            },
            {
                field: "email",
                headerName: t("users.fields.email"),
                flex: 1,
            },
            {
                field: "origin",
                headerName: t("users.fields.origin"),
                flex: 1,
            },
            {
                field: "is_active",
                headerName: t("users.fields.active"),
                type: "boolean",
                flex: 1,
            },
            {
                field: "is_admin",
                headerName: t("users.fields.admin"),
                type: "boolean",
                flex: 1,
            },
            {
                field: "mfa_enabled",
                headerName: t("users.fields.mfa_enabled"),
                type: "boolean",
                flex: 1,
            },
        ],
        [t],
    );

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/users/$userId",
            params: {
                userId: row.id,
            },
        });
    };

    const debouncedSearch = useCallback(
        debounce((searchValue: string) => {
            updateListQueryParams({
                search: searchValue,
            });
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
        resetQueryParams();
    };

    const paginationModel = {
        page: listQueryParams.offset / listQueryParams.limit,
        pageSize: listQueryParams.limit,
    };

    const handlePaginationModelChange = (model: {
        page: number;
        pageSize: number;
    }) => {
        updateListQueryParams({
            limit: model.pageSize,
            offset: model.page * model.pageSize,
            search: query,
        });
    };

    const handleChangeSortModel = (model: GridSortModel) => {
        updateListQueryParams({
            sort_by:
                model.length > 0
                    ? `${model[0].sort === "asc" ? "" : "-"}${model[0].field}`
                    : undefined,
        });
    };

    const rows = data?.payload.items || [];
    const rowCount = data?.payload.count || 0;

    if (error) {
        return <ErrorHandler error={error} message="users.list.fetch.error" />;
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap={2}
            px={4}
            pb={4}
            height={1}
        >
            <Stack
                direction="row"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <TextField
                    placeholder={t("users.search.placeholder")}
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

                <Link to="/users/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                        sx={{ whiteSpace: "nowrap" }}
                    >
                        {t("users.new")}
                    </Button>
                </Link>
            </Stack>

            <Box flex={1} position="relative">
                <Box sx={{ position: "absolute", inset: 0 }}>
                    <DataGrid
                        sx={{
                            "& .MuiDataGrid-row": {
                                cursor: "pointer",
                            },
                        }}
                        columns={columns}
                        rows={rows}
                        rowCount={rowCount}
                        initialState={{
                            sorting: {
                                sortModel: [{ field: "name", sort: "asc" }],
                            },
                        }}
                        onRowClick={handleClickRow}
                        paginationModel={paginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        onSortModelChange={handleChangeSortModel}
                        loading={isLoading || isFetching}
                        sortingMode="server"
                        paginationMode="server"
                        density="compact"
                    />
                </Box>
            </Box>
        </Box>
    );
};
