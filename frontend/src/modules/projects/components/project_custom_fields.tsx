import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { Link } from "components";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import type { CustomFieldT, ProjectDetailT } from "types";
import {
    formatErrorMessages,
    noLimitListQueryParams,
    toastApiError,
} from "utils";

interface ICustomFieldListProps {
    project: ProjectDetailT;
}

const CustomFieldList: FC<ICustomFieldListProps> = ({ project }) => {
    const { t } = useTranslation();
    const { id: projectId } = project;

    const {
        data: customFields,
        isLoading: customFieldsLoading,
        error,
    } = projectApi.useListProjectAvailableCustomFieldsQuery({
        id: projectId,
        ...noLimitListQueryParams,
    });

    const [addProjectCustomField, { isLoading: addProjectCustomFieldLoading }] =
        projectApi.useAddProjectCustomFieldMutation();

    const handleClickAddCustomField = (customFieldId: string) => {
        addProjectCustomField({ id: projectId, customFieldId })
            .unwrap()
            .then(() => {
                toast.success(t("projects.customFields.add.success"));
            })
            .catch(toastApiError);
    };

    const fields = customFields?.payload.items || [];

    if (customFieldsLoading)
        return (
            <Box display="flex" justifyContent="center">
                <CircularProgress color="inherit" />
            </Box>
        );

    if (error)
        return (
            <Typography fontWeight="bold" color="error">
                {formatErrorMessages(error) ||
                    t("projects.customFields.fetch.error")}
            </Typography>
        );

    if (!customFields)
        return (
            <Typography fontWeight="bold">
                {t("projects.customFields.empty")}
            </Typography>
        );

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {fields.length} {t("projects.customFields.fields")}
                </Typography>

                {addProjectCustomFieldLoading && (
                    <CircularProgress color="inherit" size={14} />
                )}
            </Box>

            <Divider flexItem />

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                flex={1}
                overflow="auto"
            >
                {fields.map((field) => (
                    <Box
                        key={field.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                                onClick={() =>
                                    handleClickAddCustomField(field.id)
                                }
                                size="small"
                            >
                                <AddIcon />
                            </IconButton>

                            <Link
                                to="/custom-fields/$customFieldGroupId"
                                params={{
                                    customFieldGroupId: field.gid,
                                }}
                                flex={1}
                                fontWeight="bold"
                            >
                                {field.name} ({field.label})
                            </Link>
                        </Box>

                        <Typography>{field.type}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

interface IRemoveProjectCustomFieldDialogProps {
    open: boolean;
    projectId: string;
    customField: CustomFieldT | null;
    onClose: () => void;
}

const RemoveProjectCustomFieldDialog: FC<
    IRemoveProjectCustomFieldDialogProps
> = ({ open, projectId, customField, onClose }) => {
    const { t } = useTranslation();

    const [removeProjectCustomField, { isLoading }] =
        projectApi.useRemoveProjectCustomFieldMutation();

    const handleClickRemove = () => {
        if (!customField) return;

        removeProjectCustomField({
            id: projectId,
            customFieldId: customField.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.customFields.remove.success"));
                onClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("projects.customFields.remove.title")} "{customField?.name}"?
                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("projects.customFields.remove.warning")}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickRemove}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.customFields.remove.title")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IProjectCustomFieldsProps {
    project: ProjectDetailT;
}

const ProjectCustomFields: FC<IProjectCustomFieldsProps> = ({ project }) => {
    const { t } = useTranslation();

    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<CustomFieldT | null>(
        null,
    );

    const columns: GridColDef<CustomFieldT>[] = useMemo(
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
                            setRemoveDialogOpen(true);
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
                renderCell: ({ row }) => (
                    <Link
                        to="/custom-fields/$customFieldGroupId"
                        params={{
                            customFieldGroupId: row.gid,
                        }}
                        flex={1}
                        fontWeight="bold"
                    >
                        {row.name}
                    </Link>
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
        [t],
    );

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <RemoveProjectCustomFieldDialog
                open={removeDialogOpen}
                projectId={project.id}
                customField={selectedField}
                onClose={() => setRemoveDialogOpen(false)}
            />

            <Box display="flex" gap={2} height="100%">
                <Box flex={1}>
                    <DataGrid
                        columns={columns}
                        rows={project.custom_fields}
                        density="compact"
                    />
                </Box>

                <Box flex={1}>
                    <CustomFieldList project={project} />
                </Box>
            </Box>
        </Box>
    );
};

export { ProjectCustomFields };
