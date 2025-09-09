import { DashboardTileT } from "shared/model/types";

export interface WidgetProps {
    widget: DashboardTileT;
    issueCount?: number;
    onEdit: (widget: DashboardTileT) => void;
    onClone: (widget: DashboardTileT) => void;
    onDelete: (widget: DashboardTileT) => void;
    canManage?: boolean;
}
