import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid";
import { Link, useNavigate } from "@tanstack/react-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { issueApi } from "store/api/issue.api.ts";
import { IssueT } from "types";

export const IssuesList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data, isLoading } = issueApi.useListIssuesQuery();

    const columns: GridColDef<IssueT>[] = [
        {
            field: "subject",
            headerName: t("issue.fields.subject"),
            flex: 1,
        },
        {
            field: "project",
            headerName: t("issue.fields.project"),
            flex: 1,
            valueGetter: (_, row) => row.project.name,
        },
    ];

    const handleClickRow: GridEventListener<"rowClick"> = ({ row }) => {
        navigate({
            to: "/issues/$issueId",
            params: {
                issueId: row.id,
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
            <Stack direction="row">
                <Typography fontSize={24} fontWeight="bold">
                    {t("issues.title")}
                </Typography>

                <Link to="/issues/create">
                    <IconButton size="small">
                        <AddIcon />
                    </IconButton>
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
                loading={isLoading}
                density="compact"
                onRowClick={handleClickRow}
            />
        </Box>
    );
};

export default IssuesList;
