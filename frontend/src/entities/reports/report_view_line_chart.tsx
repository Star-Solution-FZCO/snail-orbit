import { LineChart } from "@mui/x-charts";

type ReportViewLineChartProps = {
    data: number[][];
    axis: { id: string; label: string }[];
};

export const ReportViewLineChart = (props: ReportViewLineChartProps) => {
    const { axis, data } = props;

    return (
        <LineChart
            series={data.map((el) => ({ data: el }))}
            xAxis={[{ scaleType: "band", data: axis.map((el) => el.label) }]}
        />
    );
};
