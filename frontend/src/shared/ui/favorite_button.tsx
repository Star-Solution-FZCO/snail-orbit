import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { Fade, IconButton, type IconButtonProps, Tooltip } from "@mui/material";
import type { FC } from "react";
import { memo, useMemo } from "react";

type FavoriteButtonProps = {
    favorite: boolean;
    tooltip?: string;
} & IconButtonProps;

const FavoriteButton: FC<FavoriteButtonProps> = memo(
    ({ favorite, tooltip, ...rest }) => {
        const icon = useMemo(() => {
            const Icon = favorite ? FavoriteIcon : FavoriteBorderIcon;

            return (
                <IconButton
                    disableRipple
                    {...rest}
                    sx={{
                        color: favorite ? "hotpink" : "grey.600",
                        "& :hover": {
                            color: "hotpink",
                        },
                        ...rest.sx,
                    }}
                >
                    <Icon fontSize="inherit" />
                </IconButton>
            );
        }, [favorite, rest]);

        if (tooltip)
            return (
                <Tooltip
                    title={tooltip}
                    placement="bottom-start"
                    slots={{ transition: Fade }}
                    enterDelay={300}
                    enterNextDelay={100}
                >
                    {icon}
                </Tooltip>
            );
        else return icon;
    },
);

FavoriteButton.displayName = "FavoriteButton";

export { FavoriteButton };

export default FavoriteButton;
