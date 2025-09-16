import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
} from "@mui/material";

type ReportViewTableProps = {
    data: number[][];
    xAxis: { id: string; label: string }[];
    yAxis: { id: string; label: string }[];
};

export const ReportViewTable = (props: ReportViewTableProps) => {
    const { data, yAxis, xAxis } = props;

    return (
        <TableContainer>
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell key="middle-cell" />
                        {xAxis.map((value) => (
                            <TableCell key={value.id}>{value.label}</TableCell>
                        ))}
                    </TableRow>
                    {yAxis.map((value, yIdx) => (
                        <TableRow key={value.id}>
                            <TableCell key={`${value.id}-label`}>
                                {value.label}
                            </TableCell>
                            {xAxis.map((xValue, xIdx) => (
                                <TableCell key={`${value.id}-${xValue.id}`}>
                                    {data[yIdx]?.[xIdx]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
