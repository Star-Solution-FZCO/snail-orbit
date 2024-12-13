import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { ErrorHandler, UserAvatar } from "components";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "store";
import { UserT } from "types";
import { useListQueryParams } from "utils";

export const UserList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

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
        return <ErrorHandler error={error} message="users.list.fetch.error" />;
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
                        {rows.length} {t("users.title").toLowerCase()}
                    </Typography>
                </Box>

                <Link to="/users/create">
                    <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        size="small"
                    >
                        {t("users.new")}
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
