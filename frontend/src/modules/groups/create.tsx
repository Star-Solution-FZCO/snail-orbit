import { Breadcrumbs, Container, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { groupApi, useAppSelector } from "shared/model";
import type { CreateGroupT } from "shared/model/types";
import { Link, NotFound } from "shared/ui";
import { toastApiError } from "shared/utils";
import { GroupForm } from "./components/group_form";

const GroupCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isAdmin = useAppSelector((state) => state.profile.user?.is_admin);

    const [createGroup, { isLoading }] = groupApi.useCreateGroupMutation();

    const onSubmit = (formData: CreateGroupT) => {
        createGroup(formData)
            .unwrap()
            .then((response) => {
                navigate({
                    to: "/groups/$groupId",
                    params: { groupId: response.payload.id },
                });
                toast.success(t("groups.create.success"));
            })
            .catch(toastApiError);
    };

    if (!isAdmin) {
        return <NotFound />;
    }

    return (
        <Container sx={{ px: 4, pb: 4 }} disableGutters>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link to="/groups" underline="hover">
                    <Typography fontSize={24} fontWeight="bold">
                        {t("groups.title")}
                    </Typography>
                </Link>
                <Typography fontSize={24} fontWeight="bold">
                    {t("groups.create.title")}
                </Typography>
            </Breadcrumbs>

            <GroupForm onSubmit={onSubmit} loading={isLoading} />
        </Container>
    );
};

export { GroupCreate };
