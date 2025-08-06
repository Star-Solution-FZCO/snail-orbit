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
} from "@mui/material";
import type {
    GridColDef,
    GridEventListener,
    GridSortModel,
} from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { roleApi } from "shared/model";
import type { GlobalRoleT, ListQueryParams } from "shared/model/types";
import { ErrorHandler, Link } from "shared/ui";
import { useListQueryParams } from "shared/utils";

const initialQueryParams = {
    limit: 50,
    offset: 0,
    sort_by: "name",
};

const GlobalRoleList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [query, setQuery] = useState<string>("");

    const [listQueryParams, updateListQueryParams, resetQueryParams] =
        useListQueryParams<ListQueryParams>(initialQueryParams);

    const { data, isLoading, isFetching, error } =
        roleApi.useListGlobalRoleQuery(listQueryParams);

    const columns: GridColDef<GlobalRoleT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("globalRoles.fields.name"),
                flex: 1,
                renderCell: ({ row }) => (
                    <Link
                        to="/global-roles/$globalRoleId"
                        params={{ globalRoleId: row.id }}
                    >
                        {row.name}
                    </Link>
                ),
            },
            {
                field: "description",
                headerName: t("description"),
                flex: 1,
            },
        ],
        [t],
    );

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/global-roles/$globalRoleId",
            params: {
                globalRoleId: row.id,
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
        return (
            <ErrorHandler
                error={error}
                message="globalRoles.list.fetch.error"
            />
        );
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
                    placeholder={t("globalRoles.search.placeholder")}
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

                <Link to="/global-roles/create">
                    <Button
                        sx={{ whiteSpace: "nowrap", height: "40px" }}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("globalRoles.new")}
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

export { GlobalRoleList };
