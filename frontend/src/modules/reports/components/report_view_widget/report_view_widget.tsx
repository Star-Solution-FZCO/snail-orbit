import { ReportViewBarChart } from "entities/reports/report_view_bar_chart";
import { ReportViewLineChart } from "entities/reports/report_view_line_chart";
import { ReportViewTable } from "entities/reports/report_view_table";
import { useMemo } from "react";
import { ReportDisplayType, type ReportDataT } from "shared/model/types/report";
import { formatAxisValues } from "./utils";

type ReportViewWidgetProps = {
    reportData: ReportDataT;
    type: ReportDisplayType;
};

export const ReportViewWidget = (props: ReportViewWidgetProps) => {
    const { reportData, type } = props;

    const values = useMemo(() => {
        const xAxis = formatAxisValues(reportData?.axis_1);
        const yAxis = formatAxisValues(reportData.axis_2);
        const data = reportData.data;

        return { xAxis, yAxis, data };
    }, [reportData]);

    switch (type) {
        case ReportDisplayType.TABLE:
            return <ReportViewTable {...values} />;
        case ReportDisplayType.LINE_CHART:
            return (
                <ReportViewLineChart data={values.data} axis={values.xAxis} />
            );
        case ReportDisplayType.BAR_CHART:
            return (
                <ReportViewBarChart data={values.data} axis={values.xAxis} />
            );
        case ReportDisplayType.PIE_CHART:
        default:
            return null;
    }
};
