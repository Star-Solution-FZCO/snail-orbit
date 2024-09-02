import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { IssueT } from "types";
import { useListQueryParams } from "utils";

const IssueList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const { data, isLoading, isFetching } =
        issueApi.useListIssuesQuery(listQueryParams);

    const columns: GridColDef<IssueT>[] = useMemo(
        () => [
            {
                field: "subject",
                headerName: t("issues.fields.subject"),
                flex: 1,
            },
            {
                field: "project",
                headerName: t("issues.fields.project"),
                flex: 1,
                valueGetter: (_, row) => row.project.name,
            },
        ],
        [t],
    );

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/issues/$issueId",
            params: {
                issueId: row.id,
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
                <Typography fontSize={24} fontWeight="bold">
                    {t("issues.title")}
                </Typography>

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

export { IssueList };
