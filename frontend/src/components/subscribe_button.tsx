import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Fade, IconButton, Tooltip } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface ISubscribeButtonProps {
    isSubscribed: boolean;
    onToggle: () => void;
    type: "issue" | "project";
}

export const SubscribeButton: FC<ISubscribeButtonProps> = ({
    isSubscribed,
    onToggle,
    type,
}) => {
    const { t } = useTranslation();

    const Icon = isSubscribed ? StarIcon : StarBorderIcon;

    return (
        <Tooltip
            title={t(`${type}s.${isSubscribed ? "unsubscribe" : "subscribe"}`)}
            placement="bottom-start"
            slots={{ transition: Fade }}
            enterDelay={300}
            enterNextDelay={100}
        >
            <IconButton
                sx={{
                    p: 0,
                    color: isSubscribed ? "warning.main" : "grey.600",
                    "& :hover": {
                        color: "warning.main",
                    },
                }}
                onClick={onToggle}
                size="small"
                disableRipple
            >
                <Icon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};
