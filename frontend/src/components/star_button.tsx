import { Star, StarOutline } from "@mui/icons-material";
import type { IconButtonProps } from "@mui/material";
import { IconButton } from "@mui/material";
import type { FC } from "react";

type StarButtonProps = IconButtonProps & {
    starred?: boolean;
};

export const StarButton: FC<StarButtonProps> = ({ starred, ...props }) => {
    return (
        <IconButton {...props}>
            {starred ? (
                <Star fontSize="inherit" />
            ) : (
                <StarOutline fontSize="inherit" />
            )}
        </IconButton>
    );
};
