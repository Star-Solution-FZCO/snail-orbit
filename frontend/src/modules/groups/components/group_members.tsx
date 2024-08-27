import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import {
    Avatar,
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi, userApi } from "store";
import { GroupMemberT } from "types";
import { toastApiError } from "utils";

interface IAddGroupMemberProps {
    groupId: string;
    open: boolean;
    onClose: () => void;
}

const AddGroupMember: FC<IAddGroupMemberProps> = ({
    groupId,
    open,
    onClose,
}) => {
    const { t } = useTranslation();

    const { data: users } = userApi.useListUserQuery();

    const [addGroupMember, { isLoading }] =
        groupApi.useAddGroupMemberMutation();

    const handleClickAdd = (userId: string) => {
        addGroupMember({ id: groupId, userId })
            .unwrap()
            .then(onClose)
            .catch(toastApiError);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={(theme) => ({
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: theme.palette.background.paper,
                    p: 4,
                    boxShadow: 16,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 400,
                })}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                >
                    <Typography fontSize={20} fontWeight="bold">
                        {t("groups.members.add")}
                    </Typography>

                    <IconButton
                        onClick={onClose}
                        size="small"
                        disabled={isLoading}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <TextField
                    InputProps={{
                        startAdornment: <SearchIcon />,
                    }}
                    placeholder={t("groups.members.filter")}
                    size="small"
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
            </Box>
        </Modal>
    );
};

interface IGroupFormProps {
    groupId: string;
}

const GroupMembers: FC<IGroupFormProps> = ({ groupId }) => {
    const { t } = useTranslation();

    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    const {
        data: members,
        isLoading,
        isFetching,
    } = groupApi.useListGroupMembersQuery(groupId);

    const [removeGroupMember] = groupApi.useRemoveGroupMemberMutation();

    const handleClickRemoveMember = (member: GroupMemberT) => {
        removeGroupMember({ id: groupId, userId: member.id })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<GroupMemberT>[] = [
        {
            field: "delete",
            headerName: "",
            sortable: false,
            resizable: false,
            width: 60,
            align: "center",
            renderCell: ({ row }) => (
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClickRemoveMember(row);
                    }}
                    size="small"
                    color="error"
                >
                    <DeleteIcon />
                </IconButton>
            ),
        },
        {
            field: "name",
            headerName: t("groups.members.name"),
            flex: 1,
        },
        {
            field: "email",
            headerName: t("groups.members.email"),
            flex: 1,
        },
    ];

    const rows = members?.payload.items || [];

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box>
                <Button
                    onClick={() => setAddMemberDialogOpen(true)}
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                >
                    {t("groups.members.add")}
                </Button>
            </Box>

            <DataGrid
                columns={columns}
                rows={rows}
                density="compact"
                loading={isLoading || isFetching}
            />

            <AddGroupMember
                groupId={groupId}
                open={addMemberDialogOpen}
                onClose={() => setAddMemberDialogOpen(false)}
            />
        </Box>
    );
};

export { GroupMembers };
