import { Box, Stack, Typography } from "@mui/material";
import type { FC } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { agileBoardApi } from "shared/model";
import type { AgileBoardT } from "shared/model/types";
import { StarButton } from "shared/ui";
import { IssueLink } from "shared/ui/issue_link";

type BoardRowProps = {
    board: AgileBoardT;
};

export const BoardRow: FC<BoardRowProps> = ({ board }) => {
    const { t } = useTranslation();

    const [favoriteBoard] = agileBoardApi.useFavoriteBoardMutation();

    const handleClickFavorite = useCallback(() => {
        favoriteBoard({ boardId: board.id, favorite: !board.is_favorite });
    }, [board.id, board.is_favorite, favoriteBoard]);

    return (
        <Stack direction="row" alignItems="center" gap={2}>
            <StarButton
                sx={{ p: 0 }}
                starred={board.is_favorite}
                onClick={handleClickFavorite}
            />

            <Box>
                <IssueLink to="/agiles/$boardId" params={{ boardId: board.id }}>
                    {board.name}
                </IssueLink>

                <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    sx={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    {board.description || t("description.empty")}
                </Typography>
            </Box>
        </Stack>
    );
};
