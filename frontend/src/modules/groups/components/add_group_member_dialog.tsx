import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from "@mui/material";
import { UserAvatar } from "components";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupApi, userApi } from "store";
import { BasicUserT } from "types";
import { noLimitListQueryParams, toastApiError } from "utils";

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

    const [user, setUser] = useState<BasicUserT | null>(null);

    const { data } = userApi.useListSelectUserQuery(noLimitListQueryParams);

    const [addGroupMember, { isLoading }] =
        groupApi.useAddGroupMemberMutation();

    const handleClickAdd = () => {
        if (!user) return;

        addGroupMember({ id: groupId, userId: user.id })
            .unwrap()
            .then(() => {
                onClose();
                setUser(null);
            })
            .catch(toastApiError);
    };

    const users = data?.payload?.items || [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("groups.members.add")}

                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
                <Autocomplete
                    value={user}
                    options={users}
                    getOptionLabel={(option) => option.name}
                    onChange={(_, value) => setUser(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder={t("groups.members.filter")}
                        />
                    )}
                    renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                            <li key={key} {...optionProps}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <UserAvatar src={option.avatar} />
                                    {option.name}
                                </Box>
                            </li>
                        );
                    }}
                    size="small"
                />
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    disabled={isLoading}
                >
                    {t("cancel")}
                </Button>

                <LoadingButton
                    onClick={handleClickAdd}
                    variant="outlined"
                    disabled={!user}
                    loading={isLoading}
                >
                    {t("groups.members.add")}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};
