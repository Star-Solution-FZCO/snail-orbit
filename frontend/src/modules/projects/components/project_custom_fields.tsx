import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Box,
    Button,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "shared/model";
import type { CustomFieldT, ProjectT } from "shared/model/types";
import { Link } from "shared/ui";
import {
    formatErrorMessages,
    noLimitListQueryParams,
    toastApiError,
} from "shared/utils";
import { groupCustomFields } from "../utils";

const Bundle: FC<{
    bundle: { gid: string; name: string; fields: CustomFieldT[] };
    onAddCustomFieldClick: (id: string) => void;
}> = ({ bundle, onAddCustomFieldClick }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Stack>
            <Stack
                direction="row"
                alignItems="center"
                gap={1}
                pb={0.5}
                mb={0.5}
                position="sticky"
                zIndex={1}
                bgcolor="background.default"
                borderBottom={1}
                borderColor="divider"
                top={0}
            >
                <IconButton
                    onClick={() => setExpanded((prev) => !prev)}
                    size="small"
                >
                    <ExpandMoreIcon
                        sx={{
                            transform: expanded
                                ? "rotate(180deg)"
                                : "rotate(0)",
                            transition: "transform 0.2s",
                        }}
                        fontSize="small"
                    />
                </IconButton>

                <Link
                    to="/custom-fields/$customFieldGroupId"
                    params={{
                        customFieldGroupId: bundle.gid,
                    }}
                    fontWeight="bold"
                >
                    {bundle.name}
                </Link>
            </Stack>

            <Collapse in={expanded}>
                <Stack pl={0.5} pt={0.5}>
                    {bundle.fields.map((field) => (
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
                                        onAddCustomFieldClick(field.id)
                                    }
                                    size="small"
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>

                                <Typography flex={1} fontWeight="bold">
                                    {field.label}
                                </Typography>
                            </Box>

                            <Typography>{field.type}</Typography>
                        </Box>
                    ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};

interface ICustomFieldListProps {
    project: ProjectT;
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

    const bundles = groupCustomFields(customFields?.payload.items || []);

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
        <Box display="flex" flexDirection="column" gap={1} height={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {bundles.length} {t("projects.customFields.fields")}
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
                flex="1 1 0"
                overflow="auto"
                pr={1}
            >
                {bundles.map((bundle) => (
                    <Bundle
                        key={bundle.gid}
                        bundle={bundle}
                        onAddCustomFieldClick={handleClickAddCustomField}
                    />
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

                <Button
                    onClick={handleClickRemove}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.customFields.remove.title")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface IProjectCustomFieldsProps {
    project: ProjectT;
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

    const rows = project.custom_fields;

    return (
        <Stack direction="row" gap={2} height={1}>
            <RemoveProjectCustomFieldDialog
                open={removeDialogOpen}
                projectId={project.id}
                customField={selectedField}
                onClose={() => setRemoveDialogOpen(false)}
            />

            <Stack flex={1} minHeight={0}>
                <DataGrid
                    sx={{ flex: "1 1 0" }}
                    columns={columns}
                    rows={rows}
                    density="compact"
                    disableRowSelectionOnClick
                    disableColumnMenu
                />
            </Stack>

            <Box flex={1} height={1}>
                <CustomFieldList project={project} />
            </Box>
        </Stack>
    );
};

export { ProjectCustomFields };
