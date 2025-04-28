import { Avatar } from "@mui/material";
import { FC } from "react";

const UserAvatar: FC<{ src: string; size?: number }> = ({ src, size = 24 }) => (
    <Avatar sx={{ width: size, height: size }} src={src} />
);

export { UserAvatar };
