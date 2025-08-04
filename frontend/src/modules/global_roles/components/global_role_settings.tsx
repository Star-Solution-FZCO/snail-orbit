import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
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
import { globalRoleApi } from "shared/model";
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
        globalRoleApi.useUpdateGlobalRoleMutation();
    const [deleteGlobalRole, { isLoading: isDeleting }] =
        globalRoleApi.useDeleteGlobalRoleMutation();

    const handleUpdate = async (data: {
        name: string;
        description: string | null;
    }) => {
        try {
            await updateGlobalRole({
                id: role.id,
                ...data,
            }).unwrap();
        } catch (error) {
            toastApiError(error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteGlobalRole(role.id).unwrap();
            navigate({ to: "/global-roles" });
        } catch (error) {
            toastApiError(error);
        }
    };

    return (
        <Stack gap={3}>
            <Box>
                <Typography variant="h6" mb={2}>
                    {t("global-roles.sections.general")}
                </Typography>
                <GlobalRoleForm
                    role={role}
                    onSubmit={handleUpdate}
                    isSubmitting={isUpdating}
                />
            </Box>

            <Divider />

            <Box>
                <Typography variant="h6" mb={2} color="error">
                    {t("global-roles.sections.danger")}
                </Typography>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setShowDeleteDialog(true)}
                >
                    {t("global-roles.actions.delete")}
                </Button>
            </Box>

            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
            >
                <DialogTitle>{t("global-roles.delete.title")}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t("global-roles.delete.confirmation", {
                            name: role.name,
                        })}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>
                        {t("cancel")}
                    </Button>
                    <LoadingButton
                        onClick={handleDelete}
                        loading={isDeleting}
                        color="error"
                        variant="contained"
                    >
                        {t("delete")}
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export { GlobalRoleSettings };
