import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, IconButton } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { UserAvatar } from "components";
import { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi } from "store";
import { BasicUserT } from "types";
import { toastApiError, useListQueryParams } from "utils";
import { AddGroupMemberDialog } from "./add_group_member_dialog";

interface IGroupMembersProps {
    groupId: string;
}

const GroupMembers: FC<IGroupMembersProps> = ({ groupId }) => {
    const { t } = useTranslation();

    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 50,
    });

    const {
        data: members,
        isLoading,
        isFetching,
    } = groupApi.useListGroupMembersQuery({
        id: groupId,
        params: listQueryParams,
    });

    const [removeGroupMember] = groupApi.useRemoveGroupMemberMutation();

    const handleClickRemoveMember = (member: BasicUserT) => {
        removeGroupMember({ id: groupId, userId: member.id })
            .unwrap()
            .catch(toastApiError);
    };

    const columns: GridColDef<BasicUserT>[] = useMemo(
        () => [
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
                renderCell: ({ row }) => (
                    <Box display="flex" alignItems="center" gap={1}>
                        <UserAvatar src={row.avatar} />
                        {row.name}
                    </Box>
                ),
            },
            {
                field: "email",
                headerName: t("groups.members.email"),
                flex: 1,
            },
        ],
        [t],
    );

    const paginationModel = {
        page: listQueryParams.offset / listQueryParams.limit,
        pageSize: listQueryParams.limit,
    };

    const handlePaginationModelChange = (model: {
        page: number;
        pageSize: number;
    }) => {
        updateListQueryParams({
            limit: model.pageSize,
            offset: model.page * model.pageSize,
        });
    };

    const rows = members?.payload.items || [];
    const rowCount = members?.payload.count || 0;

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
                sx={{
                    "& .MuiDataGrid-row": {
                        cursor: "pointer",
                    },
                }}
                columns={columns}
                rows={rows}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                loading={isLoading || isFetching}
                paginationMode="server"
                density="compact"
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
