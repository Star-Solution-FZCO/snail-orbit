import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    Modal,
    Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, projectApi } from "store";
import { CustomFieldT, ProjectDetailT } from "types";
import { toastApiError } from "utils";

interface IAddProjectCustomFieldProps {
    projectId: string;
}

const AddProjectCustomField: FC<IAddProjectCustomFieldProps> = ({
    projectId,
}) => {
    const { t } = useTranslation();

    const { data: customFields, isLoading: customFieldsLoading } =
        customFieldsApi.useListCustomFieldsQuery();

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

    if (customFieldsLoading)
        return (
            <Box display="flex" justifyContent="center">
                <CircularProgress color="inherit" />
            </Box>
        );

    if (!customFields)
        return <Typography>{t("projects.customFields.empty")}</Typography>;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {customFields.payload.items.length}{" "}
                    {t("projects.customFields.fields")}
                </Typography>

                {addProjectCustomFieldLoading && (
                    <CircularProgress color="inherit" size={14} />
                )}
            </Box>

            <Divider flexItem />

            {customFields.payload.items.map((field) => (
                <Box key={field.id} display="flex" gap={1} alignItems="center">
                    <IconButton
                        onClick={() => handleClickAddCustomField(field.id)}
                        size="small"
                    >
                        <AddIcon />
                    </IconButton>

                    <Typography flex={1} fontWeight="bold">
                        {field.name}
                    </Typography>

                    <Typography>{field.type}</Typography>
                </Box>
            ))}
        </Box>
    );
};

interface IRemoveProjectCustomFieldDialogProps {
    projectId: string;
    customField: CustomFieldT | null;
    onClose: () => void;
}

const RemoveProjectCustomFieldDialog: FC<
    IRemoveProjectCustomFieldDialogProps
> = ({ projectId, customField, onClose }) => {
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
        <Modal open={!!customField} onClose={onClose}>
            <Box
                sx={(theme) => ({
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.palette.background.paper,
                    p: 4,
                    boxShadow: 16,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                })}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontSize={20} fontWeight="bold">
                        {t("projects.customFields.remove.title")} "
                        {customField?.name}"?
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        disabled={isLoading}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Typography>
                    {t("projects.customFields.remove.warning")}
                </Typography>

                <Box display="flex" gap={1}>
                    <LoadingButton
                        onClick={handleClickRemove}
                        variant="outlined"
                        loading={isLoading}
                    >
                        {t("projects.customFields.remove.title")}
                    </LoadingButton>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="error"
                        disabled={isLoading}
                    >
                        {t("cancel")}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

interface IProjectCustomFieldsProps {
    project: ProjectDetailT;
}

const ProjectCustomFields: FC<IProjectCustomFieldsProps> = ({ project }) => {
    const { t } = useTranslation();

    const [tab, setTab] = useState<"add" | null>(null);

    const [selectedField, setSelectedField] = useState<CustomFieldT | null>(
        null,
    );

    const columns: GridColDef<CustomFieldT>[] = [
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

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <RemoveProjectCustomFieldDialog
                projectId={project.id}
                customField={selectedField}
                onClose={() => setSelectedField(null)}
            />

            <Box display="flex" justifyContent="space-between">
                <Button
                    onClick={() => setTab("add")}
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                >
                    {t("projects.customFields.add")}
                </Button>

                {tab && (
                    <Button
                        onClick={() => setTab(null)}
                        size="small"
                        variant="outlined"
                    >
                        {t("projects.customFields.hide")}
                    </Button>
                )}
            </Box>

            <Box display="flex" gap={2} height="100%">
                <Box flex={1}>
                    <DataGrid
                        columns={columns}
                        rows={project.custom_fields}
                        density="compact"
                    />
                </Box>

                <Box flex={1}>
                    {tab === "add" && (
                        <AddProjectCustomField projectId={project.id} />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export { ProjectCustomFields };
