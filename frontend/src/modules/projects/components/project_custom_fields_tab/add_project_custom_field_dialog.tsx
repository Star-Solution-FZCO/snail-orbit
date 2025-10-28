import CloseIcon from "@mui/icons-material/Close";
import { TabContext, TabList } from "@mui/lab";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tab,
    Typography,
} from "@mui/material";
import { CustomFieldGroupForm } from "features/custom_fields/custom_field_group_form";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, projectApi } from "shared/model";
import { CreateCustomFieldGroupT, ProjectT } from "shared/model/types";
import { TabPanel } from "shared/ui";
import { toastApiError } from "shared/utils";
import { ProjectAvailableCustomFieldList } from "./project_available_custom_field_list";

interface IAddProjectCustomFieldDialogProps {
    open: boolean;
    project: ProjectT;
    onClose: () => void;
}

type Tab = "create_field" | "use_existing";

export const AddProjectCustomFieldDialog: FC<
    IAddProjectCustomFieldDialogProps
> = ({ open, project, onClose }) => {
    const { t } = useTranslation();

    const [currentTab, setCurrentTab] = useState("create_field");

    const [addProjectCustomField, { isLoading: isAdding }] =
        projectApi.useAddProjectCustomFieldMutation();
    const [createCustomFieldGroup, { isLoading: isCreating }] =
        customFieldsApi.useCreateCustomFieldGroupMutation();

    const handleClose = () => {
        onClose();
        setCurrentTab("create_field");
    };

    const handleChangeTab = (_: React.SyntheticEvent, value: Tab) => {
        setCurrentTab(value);
    };

    const handleSubmitCreateCustomFieldGroup = async (
        formData: CreateCustomFieldGroupT,
    ) => {
        try {
            const createResponse =
                await createCustomFieldGroup(formData).unwrap();
            const newCustomFieldGroup = createResponse.payload;

            await addProjectCustomField({
                id: project.slug,
                customFieldId: newCustomFieldGroup.fields[0].id,
            }).unwrap();

            toast.success(t("projects.customFields.add.success"));
            handleClose();
        } catch (error) {
            toastApiError(error);
        }
    };

    const loading = isAdding || isCreating;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                display="flex"
                justifyContent="space-between"
                alignItems="center"
            >
                {t("projects.customFields.add.title", {
                    projectName: project.name,
                })}
                <IconButton
                    onClick={handleClose}
                    size="small"
                    disabled={loading}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <TabContext value={currentTab}>
                    <Box borderBottom={1} borderColor="divider" mb={1}>
                        <TabList onChange={handleChangeTab}>
                            <Tab
                                label={t("projects.customFields.add.createNew")}
                                value="create_field"
                            />

                            <Tab
                                label={t(
                                    "projects.customFields.add.useExisting",
                                )}
                                value="use_existing"
                            />
                        </TabList>
                    </Box>

                    <TabPanel value="create_field">
                        <Stack gap={1}>
                            <Typography color="textSecondary" fontSize={14}>
                                {t("projects.customFields.add.createFieldHint")}
                            </Typography>

                            <CustomFieldGroupForm
                                onSubmit={handleSubmitCreateCustomFieldGroup}
                                labelValue={project.slug}
                                loading={loading}
                            />
                        </Stack>
                    </TabPanel>

                    <TabPanel value="use_existing">
                        <ProjectAvailableCustomFieldList
                            project={project}
                            onClose={handleClose}
                        />
                    </TabPanel>
                </TabContext>
            </DialogContent>
        </Dialog>
    );
};
