import { Box, Popover, Skeleton, Stack, Typography } from "@mui/material";
import type { FC, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { userApi } from "shared/model/api/user.api";
import { UserT } from "shared/model/types";
import { UserAvatar } from "../user_avatar";

export const MentionRenderer: FC<{
    userId: string;
    username: string;
}> = ({ userId, username }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const [user, setUser] = useState<UserT | null>(null);

    const [trigger, { isLoading }] = userApi.useLazyGetUserQuery();

    const handleOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    useEffect(() => {
        if (open && userId && !user && !isLoading) {
            trigger(userId)
                .unwrap()
                .then((response) => {
                    setUser(response.payload);
                });
        }
    }, [open, userId, user, isLoading, trigger]);

    return (
        <>
            <Box
                component="span"
                sx={(theme) => ({
                    color: theme.palette.primary.main,
                    cursor: "pointer",
                    "&:hover": {
                        textDecoration: "underline",
                    },
                })}
                onMouseEnter={handleOpen}
                onMouseLeave={handleClose}
            >
                @{username}
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                sx={{
                    pointerEvents: "none",
                }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                disableRestoreFocus
            >
                {isLoading ? (
                    <Stack direction="row" alignItems="center" p={2} gap={1}>
                        <Skeleton variant="circular" width={32} height={32} />

                        <Stack>
                            <Skeleton variant="text" width={80} height={20} />
                            <Skeleton variant="text" width={120} height={16} />
                        </Stack>
                    </Stack>
                ) : (
                    <Stack direction="row" alignItems="center" p={2} gap={1}>
                        <UserAvatar
                            src={user?.avatar || ""}
                            size={32}
                            isBot={user?.is_bot}
                        />

                        <Stack>
                            <Typography variant="body2" fontWeight={500}>
                                {username}
                            </Typography>

                            {user?.email && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {user.email}
                                </Typography>
                            )}
                        </Stack>
                    </Stack>
                )}
            </Popover>
        </>
    );
};
