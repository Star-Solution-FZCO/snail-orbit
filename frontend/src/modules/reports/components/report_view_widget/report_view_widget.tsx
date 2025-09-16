import { useMemo } from "react";
import type { ReportDataT } from "shared/model/types/report";
import { ReportDisplayType } from "../../report.types";
import { formatAxisValues } from "./utils";
import { ReportViewTable } from "entities/reports/report_view_table";

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
        default:
            return null;
    }
};
