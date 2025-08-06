import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { roleApi } from "shared/model";
import type { GlobalRoleT } from "shared/model/types";
import { toastApiError } from "shared/utils";
import { GlobalRoleForm } from "./global_role_form";

interface IGlobalRoleSettingsProps {
    role: GlobalRoleT;
}

const GlobalRoleSettings: FC<IGlobalRoleSettingsProps> = ({ role }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [updateGlobalRole, { isLoading: isUpdating }] =
        roleApi.useUpdateGlobalRoleMutation();
    const [deleteGlobalRole, { isLoading: isDeleting }] =
        roleApi.useDeleteGlobalRoleMutation();

    const handleUpdate = (data: {
        name: string;
        description: string | null;
    }) => {
        updateGlobalRole({
            id: role.id,
            ...data,
        })
            .unwrap()
            .then(() => {
                toast.success(t("globalRoles.update.success"));
            })
            .catch(toastApiError);
    };

    const handleDelete = () => {
        deleteGlobalRole(role.id)
            .unwrap()
            .then(() => {
                navigate({ to: "/global-roles" });
                toast.success(t("globalRoles.delete.success"));
            })
            .catch(toastApiError);
    };

    return (
        <Stack gap={1}>
            <Typography variant="subtitle1">
                {t("globalRoles.sections.general")}
            </Typography>

            <GlobalRoleForm
                role={role}
                onSubmit={handleUpdate}
                loading={isUpdating}
                hideCancel
            />

            <Divider />

            <Typography variant="subtitle1" color="error">
                {t("globalRoles.sections.danger")}
            </Typography>

            <Box>
                <Button
                    onClick={() => setShowDeleteDialog(true)}
                    startIcon={<DeleteIcon />}
                    variant="outlined"
                    color="error"
                    size="small"
                >
                    {t("globalRoles.actions.delete")}
                </Button>
            </Box>

            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
            >
                <DialogTitle>{t("globalRoles.delete.title")}</DialogTitle>

                <DialogContent>
                    <Typography>
                        {t("globalRoles.delete.confirmation", {
                            name: role.name,
                        })}
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setShowDeleteDialog(false)}
                        variant="outlined"
                        size="small"
                    >
                        {t("cancel")}
                    </Button>

                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="outlined"
                        size="small"
                        loading={isDeleting}
                    >
                        {t("delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export { GlobalRoleSettings };
