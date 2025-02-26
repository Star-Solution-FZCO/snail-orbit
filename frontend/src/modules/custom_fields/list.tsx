import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { ErrorHandler } from "components";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { CustomFieldGroupT } from "types";
import { useListQueryParams } from "utils";

const CustomFieldList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const { data, isLoading, isFetching, error } =
        customFieldsApi.useListCustomFieldGroupsQuery(listQueryParams);

    const columns: GridColDef<CustomFieldGroupT>[] = useMemo(
        () => [
            {
                field: "name",
                headerName: t("customFields.fields.name"),
                flex: 1,
            },
            {
                field: "type",
                headerName: t("customFields.fields.type"),
                flex: 1,
            },
            {
                field: "is_nullable",
                headerName: t("customFields.fields.nullable"),
                type: "boolean",
                flex: 1,
            },
            {
                field: "fields",
                headerName: t("customFields.fields"),
                flex: 1,
                valueGetter: (_, row) => row.fields.length,
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
            height="100%"
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
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography fontSize={24} fontWeight="bold">
                        {t("customFields.title")}
                    </Typography>
                </Box>

                <Link to="/custom-fields/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("customFields.new")}
                    </Button>
                </Link>
            </Stack>

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
                onRowClick={handleClickRow}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading || isFetching}
                paginationMode="server"
                density="compact"
            />
        </Box>
    );
};

export { CustomFieldList };
