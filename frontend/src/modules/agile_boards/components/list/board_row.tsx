import { Box, Stack } from "@mui/material";
import { IssueLink } from "components/issue_link";
import { StarButton } from "components/star_button";
import type { FC } from "react";
import { useCallback } from "react";
import { agileBoardApi } from "store";
import type { AgileBoardT } from "types";

type BoardRowProps = {
    board: AgileBoardT;
};

export const BoardRow: FC<BoardRowProps> = ({ board }) => {
    const [favoriteBoard] = agileBoardApi.useFavoriteBoardMutation();

    const handleClickFavorite = useCallback(() => {
        favoriteBoard({ boardId: board.id, favorite: !board.is_favorite });
    }, [board.id, board.is_favorite]);

    return (
        <Stack
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            gap={2}
        >
            <StarButton
                size="small"
                starred={board.is_favorite}
                sx={{ mt: 1 }}
                onClick={handleClickFavorite}
            />
            <Box sx={{ py: 1 }}>
                <IssueLink to="/agiles/$boardId" params={{ boardId: board.id }}>
                    {board.name}
                </IssueLink>
                <Box sx={{ fontSize: 14 }}>{board.description}</Box>
            </Box>
        </Stack>
    );
};
