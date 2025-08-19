import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
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
import type { ProjectT, WorkflowT, WorkflowTypeT } from "shared/model/types";
import { workflowTypeMap } from "shared/ui";
import {
    formatErrorMessages,
    noLimitListQueryParams,
    toastApiError,
} from "shared/utils";

interface IWorkflowListProps {
    projectId: string;
}

const WorkflowList: FC<IWorkflowListProps> = ({ projectId }) => {
    const { t } = useTranslation();

    const {
        data,
        isLoading: workflowsLoading,
        error,
    } = projectApi.useListProjectAvailableWorkflowsQuery({
        id: projectId,
        ...noLimitListQueryParams,
    });

    const [addProjectWorkflow, { isLoading: addProjectWorkflowLoading }] =
        projectApi.useAddProjectWorkflowMutation();

    const handleClickAttachWorkflow = (workflowId: string) => {
        addProjectWorkflow({ id: projectId, workflowId })
            .unwrap()
            .then(() => {
                toast.success(t("projects.workflows.attach.success"));
            })
            .catch(toastApiError);
    };

    if (workflowsLoading)
        return (
            <Box display="flex" justifyContent="center">
                <CircularProgress color="inherit" />
            </Box>
        );

    if (error)
        return (
            <Typography fontWeight="bold" color="error">
                {formatErrorMessages(error) ||
                    t("projects.workflows.fetch.error")}
            </Typography>
        );

    if (!data)
        return (
            <Typography fontWeight="bold">
                {t("projects.workflows.empty")}
            </Typography>
        );

    const workflows = data.payload.items;

    return (
        <Box display="flex" flexDirection="column" gap={1} height={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {workflows.length} {t("projects.workflows.plural")}
                </Typography>

                {addProjectWorkflowLoading && (
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
                {workflows.map((workflow) => (
                    <Box
                        key={workflow.id}
                        display="flex"
                        flexDirection="column"
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <IconButton
                                onClick={() =>
                                    handleClickAttachWorkflow(workflow.id)
                                }
                                size="small"
                            >
                                <LinkIcon />
                            </IconButton>

                            <Typography flex={1} fontWeight="bold">
                                {workflow.name}
                            </Typography>

                            {workflowTypeMap[workflow.type].icon}

                            <Typography>
                                {t(workflowTypeMap[workflow.type].translation)}
                            </Typography>
                        </Box>

                        <Typography>{workflow.description}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

interface IDetachProjectWorkflowDialogProps {
    open: boolean;
    projectId: string;
    workflow: WorkflowT | null;
    onClose: () => void;
}

const DetachProjectWorkflowDialog: FC<IDetachProjectWorkflowDialogProps> = ({
    open,
    projectId,
    workflow,
    onClose,
}) => {
    const { t } = useTranslation();

    const [detachProjectWorkflow, { isLoading }] =
        projectApi.useRemoveProjectWorkflowMutation();

    const handleClickDetach = () => {
        if (!workflow) return;

        detachProjectWorkflow({
            id: projectId,
            workflowId: workflow.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.workflows.detach.success"));
                onClose();
            })
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                <Typography fontSize={20} fontWeight="bold">
                    {t("projects.customFields.detach.title")} "{workflow?.name}
                    "?
                </Typography>

                <IconButton onClick={onClose} size="small" disabled={isLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {t("projects.workflows.detach.confirmation")}
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
                    onClick={handleClickDetach}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.workflows.detach.title")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface IProjectWorkflowsProps {
    project: ProjectT;
}

const ProjectWorkflows: FC<IProjectWorkflowsProps> = ({ project }) => {
    const { t } = useTranslation();

    const [detachDialogOpen, setDetachDialogOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowT | null>(
        null,
    );

    const columns: GridColDef<WorkflowT>[] = useMemo(
        () => [
            {
                field: "detach",
                headerName: "",
                sortable: false,
                resizable: false,
                width: 60,
                align: "center",
                renderCell: ({ row }) => (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkflow(row);
                            setDetachDialogOpen(true);
                        }}
                        size="small"
                        color="error"
                    >
                        <LinkOffIcon />
                    </IconButton>
                ),
            },
            {
                field: "name",
                headerName: t("workflows.fields.name"),
                flex: 1,
            },
            {
                field: "description",
                headerName: t("description"),
                flex: 1,
            },
            {
                field: "type",
                headerName: t("workflows.fields.type"),
                renderCell: ({ value }) => (
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        height="100%"
                    >
                        {workflowTypeMap[value as WorkflowTypeT].icon}

                        <Typography>
                            {t(
                                workflowTypeMap[value as WorkflowTypeT]
                                    .translation,
                            )}
                        </Typography>
                    </Box>
                ),
                flex: 1,
            },
        ],
        [t],
    );

    const rows = project.workflows;

    return (
        <Stack direction="row" gap={2} height={1}>
            <DetachProjectWorkflowDialog
                open={detachDialogOpen}
                projectId={project.id}
                workflow={selectedWorkflow}
                onClose={() => setDetachDialogOpen(false)}
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
                <WorkflowList projectId={project.id} />
            </Box>
        </Stack>
    );
};

export { ProjectWorkflows };
