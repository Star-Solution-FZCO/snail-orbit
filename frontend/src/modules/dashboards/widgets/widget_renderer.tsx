import type { FC } from "react";
import { DashboardTileTypeT } from "shared/model/types";
import { IssueListWidget } from "./issue_list_widget";
import { ReportWidget } from "./report_widget";
import type { WidgetProps } from "./types";

type WidgetRendererProps = WidgetProps;

export const WidgetRenderer: FC<WidgetRendererProps> = (props) => {
    switch (props.widget.type as DashboardTileTypeT) {
        case "issue_list":
            return <IssueListWidget {...props} />;
        case "report":
            return <ReportWidget {...props} />;
        default:
            return null;
    }
};
