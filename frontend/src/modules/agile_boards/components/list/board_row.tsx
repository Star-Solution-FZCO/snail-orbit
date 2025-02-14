import { Box } from "@mui/material";
import { IssueLink } from "components/issue_link";
import type { FC } from "react";
import type { AgileBoardT } from "types";

type BoardRowProps = {
    board: AgileBoardT;
};

export const BoardRow: FC<BoardRowProps> = ({ board }) => {
    return (
        <Box sx={{ py: 1 }}>
            <IssueLink to="/agiles/$boardId" params={{ boardId: board.id }}>
                {board.name}
            </IssueLink>
            <Box sx={{ fontSize: 14 }}>{board.description}</Box>
        </Box>
    );
};
