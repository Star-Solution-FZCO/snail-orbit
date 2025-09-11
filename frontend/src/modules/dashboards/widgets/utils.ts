import type { DashboardTileTypeT } from "shared/model/types";

export const widgetTypes: Array<{
    label: string;
    type: DashboardTileTypeT;
}> = [
    {
        label: "dashboards.widgets.types.issueList",
        type: "issue_list",
    },
];
