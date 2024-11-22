import { useMemo } from "react";
import { ColumnStrategyT } from "types";
import useWindowDimensions from "utils/hooks/use-window-dimensions";

type UseCalcColumnsProps = {
    strategy: ColumnStrategyT;
    value: number;
    boardColumns: number;
};

export const useCalcColumns = ({
    strategy,
    value,
    boardColumns,
}: UseCalcColumnsProps) => {
    const { width } = useWindowDimensions();

    return useMemo(() => {
        if (strategy === "column") return value < 1 ? 1 : value;
        const boardColumnWidth = width / (boardColumns || 1) - 16; // 16px for padding
        const gap = 10; // 10px gap TODO: make it variable or smth
        if (strategy === "maxWidth") {
            let res = 1; // Always can fit at least once
            let cur = value;
            while (cur + value + gap <= boardColumnWidth) {
                cur += value + gap;
                res += 1;
            }

            return res;
        }
    }, [strategy, value, width, boardColumns]);
};
