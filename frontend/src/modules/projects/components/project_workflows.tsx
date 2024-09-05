import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ScheduleIcon from "@mui/icons-material/Schedule";
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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "store";
import { workflowApi } from "store/api/workflow.api";
import { ProjectDetailT, WorkflowT, WorkflowTypeT } from "types";
import { formatErrorMessages, toastApiError } from "utils";

const workflowTypeMap: Record<
    WorkflowTypeT,
    { translation: string; icon: JSX.Element }
> = {
    on_change: {
        translation: "projects.workflows.types.on_change",
        icon: <ChangeCircleIcon />,
    },
    scheduled: {
        translation: "projects.workflows.types.scheduled",
        icon: <ScheduleIcon />,
    },
};

interface IWorkflowListProps {
    projectId: string;
}

const WorkflowList: FC<IWorkflowListProps> = ({ projectId }) => {
    const { t } = useTranslation();

    const {
        data: workflows,
        isLoading: workflowsLoading,
        error,
    } = workflowApi.useListWorkflowQuery({
        limit: 0,
        offset: 0,
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

    if (!workflows)
        return (
            <Typography fontWeight="bold">
                {t("projects.workflows.empty")}
            </Typography>
        );

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {workflows.payload.items.length}{" "}
                    {t("projects.workflows.plural")}
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
                flex={1}
                overflow="auto"
            >
                {workflows.payload.items.map((workflow) => (
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

                <IconButton
                    sx={{ p: 0 }}
                    onClick={onClose}
                    size="small"
                    disabled={isLoading}
                >
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

                <LoadingButton
                    onClick={handleClickDetach}
                    variant="outlined"
                    loading={isLoading}
                >
                    {t("projects.workflows.detach.title")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

interface IProjectWorkflowsProps {
    project: ProjectDetailT;
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
                headerName: t("projects.workflows.fields.name"),
                flex: 1,
            },
            {
                field: "description",
                headerName: t("description"),
                flex: 1,
            },
            {
                field: "type",
                headerName: t("projects.workflows.fields.type"),
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

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <DetachProjectWorkflowDialog
                open={detachDialogOpen}
                projectId={project.id}
                workflow={selectedWorkflow}
                onClose={() => setDetachDialogOpen(false)}
            />

            <Box display="flex" gap={2} height="100%">
                <Box flex={1}>
                    <DataGrid
                        columns={columns}
                        rows={project.workflows}
                        density="compact"
                    />
                </Box>

                <Box flex={1}>
                    <WorkflowList projectId={project.id} />
                </Box>
            </Box>
        </Box>
    );
};

export { ProjectWorkflows };
