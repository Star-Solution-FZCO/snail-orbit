import SmartToyIcon from "@mui/icons-material/SmartToy";
import { Avatar, Badge, Stack } from "@mui/material";
import { FC } from "react";

const UserAvatar: FC<{ src: string; size?: number; isBot?: boolean }> = ({
    src,
    size = 24,
    isBot = false,
}) => (
    <Badge
        badgeContent={
            isBot ? (
                <Stack
                    borderRadius="50%"
                    bgcolor="primary.dark"
                    p="1px"
                    border={1}
                    borderColor="common.white"
                >
                    <SmartToyIcon sx={{ fontSize: size / 2 }} htmlColor="white"/>
                </Stack>
            ) : null
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        overlap="circular"
    >
        <Avatar sx={{ width: size, height: size }} src={src} />
    </Badge>
);

export { UserAvatar };
