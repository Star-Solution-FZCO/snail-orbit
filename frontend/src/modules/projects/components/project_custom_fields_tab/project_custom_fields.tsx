import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "shared/model";
import type { ProjectT } from "shared/model/types";
import type { CustomFieldOutput } from "shared/model/types/backend-schema.gen";
import { Link } from "shared/ui";
import { AddProjectCustomFieldDialog } from "./add_project_custom_field_dialog";
import { CustomFieldDetail } from "./custom_field_detail";
import { RemoveProjectCustomFieldDialog } from "./remove_project_custom_field_dialog";

interface IProjectCustomFieldsProps {
    project: ProjectT;
}

const ProjectCustomFields: FC<IProjectCustomFieldsProps> = ({ project }) => {
    const { t } = useTranslation();

    const isAdmin = useAppSelector(
        (state) => state.profile.user?.is_admin || false,
    );

    const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
    const [removeFieldDialogOpen, setRemoveFieldDialogOpen] = useState(false);

    const [selectedField, setSelectedField] =
        useState<CustomFieldOutput | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] =
        useState<GridRowSelectionModel>([]);

    const columns: GridColDef<CustomFieldOutput>[] = useMemo(
        () => [
            {
                field: "delete",
                headerName: "",
                sortable: false,
                resizable: false,
                width: 60,
                align: "center",
                renderCell: ({ row }) => (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedField(row);
                            setRemoveFieldDialogOpen(true);
                        }}
                        size="small"
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                ),
            },
            {
                field: "name",
                headerName: t("customFields.fields.name"),
                flex: 1,
                renderCell: ({ row }) =>
                    isAdmin ? (
                        <Link
                            to="/custom-fields/$customFieldGroupId"
                            params={{
                                customFieldGroupId: row.gid,
                            }}
                            flex={1}
                            fontWeight="bold"
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                        >
                            {row.name}
                        </Link>
                    ) : (
                        row.name
                    ),
            },
            {
                field: "label",
                headerName: t("customFields.fields.label"),
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
        ],
        [t, isAdmin],
    );

    const handleRowSelectionModelChange = (
        newSelectionModel: GridRowSelectionModel,
    ) => {
        setRowSelectionModel(newSelectionModel);
        const selectedId = newSelectionModel[0];
        const selected =
            project.custom_fields.find((field) => field.id === selectedId) ||
            null;
        setSelectedField(selected);
        setIsEditing(!!selected);
    };

    const handleClearFieldSelection = () => {
        setSelectedField(null);
        setRowSelectionModel([]);
    };

    const rows = project.custom_fields;

    return (
        <Stack gap={1} height={1}>
            <AddProjectCustomFieldDialog
                open={addFieldDialogOpen}
                project={project}
                onClose={() => setAddFieldDialogOpen(false)}
            />

            <RemoveProjectCustomFieldDialog
                open={removeFieldDialogOpen}
                projectId={project.id}
                customField={selectedField}
                onClose={() => {
                    setRemoveFieldDialogOpen(false);
                    setSelectedField(null);
                    setRowSelectionModel([]);
                    setIsEditing(false);
                }}
            />

            <Stack direction="row" alignItems="center" gap={1}>
                <Button
                    onClick={() => setAddFieldDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("projects.customFields.add")}
                </Button>

                {selectedField ? (
                    <Button
                        onClick={handleClearFieldSelection}
                        startIcon={<CloseIcon />}
                        variant="outlined"
                        size="small"
                        color="error"
                    >
                        {t("projects.customFields.clearSelection")}
                    </Button>
                ) : (
                    <Stack direction="row" alignItems="center" gap={1}>
                        <InfoIcon color="info" fontSize="small" />

                        <Typography variant="body2" color="text.secondary">
                            {t("projects.customFields.selectField.hint")}
                        </Typography>
                    </Stack>
                )}
            </Stack>

            <Stack direction="row" gap={2} flex={1}>
                <Stack flex={2} minHeight={0}>
                    <DataGrid
                        sx={{
                            flex: "1 1 0",
                            "& .MuiDataGrid-row": {
                                cursor: "pointer",
                            },
                        }}
                        columns={columns}
                        rows={rows}
                        rowSelectionModel={rowSelectionModel}
                        onRowSelectionModelChange={
                            handleRowSelectionModelChange
                        }
                        density="compact"
                        disableColumnMenu
                    />
                </Stack>

                <Box flex={3} height={1}>
                    {selectedField && isEditing && (
                        <CustomFieldDetail
                            customFieldId={selectedField.id}
                            project={project}
                        />
                    )}
                </Box>
            </Stack>
        </Stack>
    );
};

export { ProjectCustomFields };
