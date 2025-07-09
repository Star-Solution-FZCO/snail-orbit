import { Stack } from "@mui/material";
import type { FC } from "react";
import { useMemo } from "react";
import type { AgileBoardT } from "shared/model/types";
import { BoardRow } from "./board_row";

type BoardsListProps = {
    boards: AgileBoardT[];
};

export const BoardsList: FC<BoardsListProps> = (props) => {
    const { boards } = props;

    const rows = useMemo(() => {
        return boards.map((board) => <BoardRow key={board.id} board={board} />);
    }, [boards]);

    return <Stack gap={2}>{rows}</Stack>;
};
