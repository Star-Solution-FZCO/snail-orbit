import { Divider, Stack } from "@mui/material";
import type { FC } from "react";
import { useMemo } from "react";
import type { AgileBoardT } from "types";
import { interleave } from "utils/helpers/interleave";
import { BoardRow } from "./board_row";

type BoardsListProps = {
    boards: AgileBoardT[];
};

export const BoardsList: FC<BoardsListProps> = (props) => {
    const { boards } = props;

    const rows = useMemo(() => {
        const res = boards.map((board) => (
            <BoardRow key={board.id} board={board} />
        ));

        return interleave(res, <Divider />);
    }, [boards]);

    return <Stack>{rows}</Stack>;
};
