import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, IconButton } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { GroupMemberT } from "types";
import { toastApiError } from "utils";
import { AddGroupMemberDialog } from "./add_group_member_dialog";

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

            <AddGroupMemberDialog
                groupId={groupId}
                open={addMemberDialogOpen}
                onClose={() => setAddMemberDialogOpen(false)}
            />
        </Box>
    );
};

export { GroupMembers };
