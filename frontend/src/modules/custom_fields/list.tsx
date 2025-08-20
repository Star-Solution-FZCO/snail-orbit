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
import type { ChangeEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "shared/model";
import type { CustomFieldGroupT, ListQueryParams } from "shared/model/types";
import { ErrorHandler, Link } from "shared/ui";
import { useListQueryParams } from "shared/utils";
import { getProjectsByCustomFieldGroup } from "./utils/getProjectsByCustomFieldGroup";

const initialQueryParams = {
    limit: 50,
    offset: 0,
    sort_by: "name",
};

const CustomFieldList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [query, setQuery] = useState<string>("");

    const [listQueryParams, updateListQueryParams, resetQueryParams] =
        useListQueryParams<ListQueryParams>(initialQueryParams);

    const { data, isLoading, isFetching, error } =
        customFieldsApi.useListCustomFieldGroupsQuery(listQueryParams);

    const columns: GridColDef<CustomFieldGroupT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("customFields.fields.name"),
                flex: 1,
                renderCell: ({ row }) => (
                    <Link
                        to="/custom-fields/$customFieldGroupId"
                        params={{ customFieldGroupId: row.gid }}
                    >
                        {row.name}
                    </Link>
                ),
            },
            {
                field: "type",
                headerName: t("customFields.fields.type"),
                flex: 1,
            },
            {
                field: "fields",
                headerName: t("customFields.fields"),
                flex: 1,
                valueGetter: (_, row) => row.fields.length,
                sortable: false,
            },
            {
                field: "used_in",
                headerName: t("customFields.fields.usedIn"),
                flex: 1,
                valueGetter: (_, row) => {
                    const usedInProjects = getProjectsByCustomFieldGroup(
                        row.fields,
                    );
                    return usedInProjects.length;
                },
                valueFormatter: (_, row) => {
                    const usedInProjects = getProjectsByCustomFieldGroup(
                        row.fields,
                    );
                    const count = usedInProjects.length;
                    if (count === 1) return usedInProjects[0].name;
                    return t("customFields.fields.usedInCount", { count });
                },
                sortable: false,
            },
            {
                field: "description",
                headerName: t("customFields.fields.description"),
                flex: 1,
            },
        ],
        [t],
    );

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/custom-fields/$customFieldGroupId",
            params: {
                customFieldGroupId: row.gid,
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
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
                message="customFields.list.fetch.error"
            />
        );
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            gap={2}
            height={1}
            px={4}
            pb={4}
        >
            <Stack
                direction="row"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
            >
                <TextField
                    placeholder={t("customFields.search.placeholder")}
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
                <Link to="/custom-fields/create">
                    <Button
                        sx={{ whiteSpace: "nowrap", height: "40px" }}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("customFields.new")}
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
                        getRowId={(row) => row.gid}
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

export { CustomFieldList };
