import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Fade, IconButton, type IconButtonProps, Tooltip } from "@mui/material";
import type { FC } from "react";
import { memo, useMemo } from "react";

type SubscribeButtonProps = {
    starred: boolean;
    tooltip?: string;
} & IconButtonProps;

const StarButton: FC<SubscribeButtonProps> = memo(
    ({ starred, tooltip, ...rest }) => {
        const icon = useMemo(() => {
            const Icon = starred ? StarIcon : StarBorderIcon;

            return (
                <IconButton
                    disableRipple
                    {...rest}
                    sx={{
                        color: starred ? "warning.main" : "grey.600",
                        "& :hover": {
                            color: "warning.main",
                        },
                        ...rest.sx,
                    }}
                >
                    <Icon fontSize="inherit" />
                </IconButton>
            );
        }, [starred, rest]);

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

StarButton.displayName = "StarButton";

export { StarButton };

export default StarButton;
