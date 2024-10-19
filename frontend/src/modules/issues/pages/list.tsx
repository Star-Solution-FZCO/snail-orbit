import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Link } from "components";
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store";
import { slugify } from "transliteration";
import { IssueT } from "types";
import { formatErrorMessages, useListQueryParams } from "utils";

const IssueList: FC = () => {
    const { t } = useTranslation();

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const { data, isLoading, isFetching, error } =
        issueApi.useListIssuesQuery(listQueryParams);

    const columns: GridColDef<IssueT>[] = useMemo(
        () => [
            {
                field: "id_readable",
                headerName: t("issues.fields.id"),
                renderCell: (params) => (
                    <Link
                        to="/issues/$issueId/$subject"
                        params={{
                            issueId: params.value,
                            subject: slugify(params.row.subject),
                        }}
                    >
                        {params.value}
                    </Link>
                ),
            },
            {
                field: "project",
                headerName: t("issues.fields.project"),
                valueGetter: (_, row) => row.project?.name || "-",
            },
            {
                field: "subject",
                headerName: t("issues.fields.subject"),
                flex: 1,
            },
        ],
        [t],
    );

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

            <DataGrid
                columns={columns}
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading || isFetching}
                paginationMode="server"
                density="compact"
                checkboxSelection
            />
        </Box>
    );
};

export { IssueList };
