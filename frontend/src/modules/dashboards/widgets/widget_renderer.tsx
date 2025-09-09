import { FC } from "react";
import { IssueListWidget } from "./issue_list_widget";
import { WidgetProps } from "./types";

interface WidgetRendererProps extends WidgetProps {}

export const WidgetRenderer: FC<WidgetRendererProps> = (props) => {
    switch (props.widget.type) {
        case "issue_list":
            return <IssueListWidget {...props} />;
        default:
            return null;
    }
};
