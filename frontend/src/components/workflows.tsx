import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { JSX } from "react";
import type { WorkflowTypeT } from "../types";

export const workflowTypeMap: Record<
    WorkflowTypeT,
    { translation: string; icon: JSX.Element }
> = {
    on_change: {
        translation: "workflows.types.on_change",
        icon: <ChangeCircleIcon />,
    },
    scheduled: {
        translation: "workflows.types.scheduled",
        icon: <ScheduleIcon />,
    },
};
