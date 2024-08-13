import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { customFieldsApi } from "store";
import { CustomFieldT } from "types";

const CustomFieldList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data, isLoading, isFetching } =
        customFieldsApi.useListCustomFieldsQuery();

    const columns: GridColDef<CustomFieldT>[] = [
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
    ];

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/custom-fields/$customFieldId",
            params: {
                customFieldId: row.id,
            },
        });
    };

    const rows = data?.payload.items || [];

    return (
        <Box
            display="flex"
            flexDirection="column"
            px={4}
            pb={4}
            height="100%"
            gap={2}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize={24} fontWeight="bold">
                    {t("customFields.title")}
                </Typography>

                <Link to="/custom-fields/create">
                    <IconButton size="small">
                        <AddIcon />
                    </IconButton>
                </Link>
            </Box>

            <DataGrid
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={rows}
                onRowClick={handleClickRow}
                loading={isLoading || isFetching}
                density="compact"
            />
        </Box>
    );
};

export { CustomFieldList };
