import { BarChart } from "@mui/x-charts";

type ReportViewBarChartProps = {
    data: number[][];
    axis: { id: string; label: string }[];
};

export const ReportViewBarChart = (props: ReportViewBarChartProps) => {
    const { axis, data } = props;

    return (
        <BarChart
            series={data.map((el) => ({ data: el }))}
            xAxis={[{ scaleType: "band", data: axis.map((el) => el.label) }]}
        />
    );
};
