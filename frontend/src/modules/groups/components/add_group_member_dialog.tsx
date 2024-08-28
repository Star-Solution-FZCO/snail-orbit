import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
    Avatar,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { groupApi, userApi } from "store";
import { toastApiError } from "utils";

interface AddGroupMemberDialogProps {
    groupId: string;
    open: boolean;
    onClose: () => void;
}

export const AddGroupMemberDialog: FC<AddGroupMemberDialogProps> = ({
    groupId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const { data: users } = userApi.useListUserQuery({
        limit: 0,
        offset: 0,
    });

    const [addGroupMember] = groupApi.useAddGroupMemberMutation();

    const handleClickAdd = (userId: string) => {
        addGroupMember({ id: groupId, userId })
            .unwrap()
            .then(onClose)
            .catch(toastApiError);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("groups.members.add")}

                <IconButton sx={{ p: 0 }} onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
                <TextField
                    InputProps={{
                        startAdornment: <SearchIcon />,
                    }}
                    fullWidth
                    placeholder={t("groups.members.filter")}
                    size="small"
                    autoFocus
                />

                <Box
                    display="flex"
                    flexDirection="column"
                    maxHeight="400px"
                    overflow="auto"
                >
                    {users?.payload.items.map((user) => (
                        <Box
                            key={user.id}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                            }}
                            onClick={() => handleClickAdd(user.id)}
                        >
                            <Avatar
                                sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: 14,
                                    fontWeight: "bold",
                                    mr: 2,
                                }}
                            >
                                {user?.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </Avatar>

                            <Typography>{user.name}</Typography>
                        </Box>
                    ))}
                </Box>
            </DialogContent>
        </Dialog>
    );
};
