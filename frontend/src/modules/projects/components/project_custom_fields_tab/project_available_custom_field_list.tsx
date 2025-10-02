import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    Checkbox,
    debounce,
    Divider,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { DefaultValueInput } from "features/custom_fields/default_value_input";
import { FieldTypeEditor } from "features/custom_fields/options_editors/field_type_editor";
import { CopyCustomFieldDialog } from "modules/custom_fields/components/copy_custom_field_dialog";
import { groupCustomFields } from "modules/projects/utils";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { customFieldsApi, projectApi } from "shared/model";
import type {
    CustomFieldT,
    CustomFieldValueT,
    ProjectT,
} from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { Bundle } from "./bundle";

interface IProjectAvailableCustomFieldListProps {
    project: ProjectT;
    onClose: () => void;
}

export const ProjectAvailableCustomFieldList: FC<
    IProjectAvailableCustomFieldListProps
> = ({ project, onClose }) => {
    const { t } = useTranslation();
    const { id: projectId } = project;

    const [listQueryParams, updateListQueryParams] = useListQueryParams({
        limit: 1000,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedField, setSelectedField] = useState<CustomFieldT | null>(
        null,
    );
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);

    const {
        data: customFields,
        isLoading,
        isFetching,
    } = projectApi.useListProjectAvailableCustomFieldsQuery(
        {
            id: projectId,
            ...listQueryParams,
        },
        {
            refetchOnFocus: true,
            refetchOnMountOrArgChange: true,
        },
    );

    const [addProjectCustomField] =
        projectApi.useAddProjectCustomFieldMutation();
    const [copyCustomField, { isLoading: copyLoading }] =
        customFieldsApi.useCopyCustomFieldMutation();

    const debouncedUpdateQuery = useMemo(
        () =>
            debounce((searchValue: string) => {
                updateListQueryParams({
                    search: searchValue.length > 0 ? searchValue : undefined,
                    offset: 0,
                });
            }, 300),
        [updateListQueryParams],
    );

    const handleFieldClick = (field: CustomFieldT) => {
        setSelectedField(field);
    };

    const handleAdd = () => {
        if (!selectedField) return;

        addProjectCustomField({
            id: projectId,
            customFieldId: selectedField.id,
        })
            .unwrap()
            .then(() => {
                toast.success(t("projects.customFields.add.success"));
                setSelectedField(null);
                onClose();
            })
            .catch(toastApiError);
    };

    const handleCopyAndAdd = () => {
        if (!selectedField) return;
        setCopyDialogOpen(true);
    };

    const handleCopySubmit = (label: string) => {
        if (!selectedField) return;

        copyCustomField({
            gid: selectedField.gid,
            id: selectedField.id,
            label,
        })
            .unwrap()
            .then((newCustomField) => {
                const copiedField = newCustomField.payload;

                return addProjectCustomField({
                    id: projectId,
                    customFieldId: copiedField.id,
                }).unwrap();
            })
            .then(() => {
                toast.success(t("projects.customFields.add.success"));
                setCopyDialogOpen(false);
                setSelectedField(null);
                onClose();
            })
            .catch(toastApiError);
    };

    const handleCopyDialogClose = () => {
        setCopyDialogOpen(false);
    };

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setSearchQuery(value);
            debouncedUpdateQuery(value);
        },
        [setSearchQuery, debouncedUpdateQuery],
    );

    const bundles = groupCustomFields(customFields?.payload.items || []);
    const loading = isLoading || isFetching;

    return (
        <Stack direction="row" gap={1}>
            <Stack gap={1} flex={1}>
                <TextField
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={t("projects.customFields.search.placeholder")}
                    size="small"
                />

                <Stack position="relative">
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        borderBottom={1}
                        borderColor="divider"
                        pb={0.5}
                    >
                        <Typography fontWeight="bold">
                            {t("projects.customFields.bundles", {
                                count: bundles.length,
                            })}{" "}
                            (
                            {t("projects.customFields.fields", {
                                count:
                                    customFields?.payload?.items?.length || 0,
                            })}
                            )
                        </Typography>
                    </Box>

                    {loading && (
                        <LinearProgress
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                width: 1,
                            }}
                        />
                    )}
                </Stack>

                {bundles.length === 0 && (
                    <Typography color="textSecondary" fontSize={14}>
                        {t("projects.customFields.empty")}
                    </Typography>
                )}

                <Stack gap={1} overflow="auto" pr={1}>
                    {bundles.map((bundle) => (
                        <Bundle
                            key={bundle.gid}
                            bundle={bundle}
                            onCustomFieldClick={handleFieldClick}
                            selectedFieldId={selectedField?.id}
                        />
                    ))}
                </Stack>
            </Stack>

            <Divider orientation="vertical" flexItem />

            <Stack flex={1} gap={1}>
                {selectedField ? (
                    <>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={1}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                {selectedField.name}
                            </Typography>

                            <IconButton
                                onClick={() => setSelectedField(null)}
                                size="small"
                            >
                                <CloseIcon />
                            </IconButton>
                        </Stack>

                        <Typography>
                            <Typography component="span" fontWeight="bold">
                                {t("customFields.form.label")}:
                            </Typography>{" "}
                            <Typography component="span" color="info">
                                {selectedField.label}
                            </Typography>
                        </Typography>

                        <Typography>
                            <Typography component="span" fontWeight="bold">
                                {t("customFields.fields.type")}:
                            </Typography>{" "}
                            <Typography component="span" color="info">
                                {selectedField.type}
                            </Typography>
                        </Typography>

                        <FormControlLabel
                            label={t("customFields.form.nullable")}
                            control={
                                <Checkbox
                                    checked={selectedField.is_nullable}
                                    size="small"
                                    readOnly
                                    disableRipple
                                />
                            }
                        />

                        <DefaultValueInput
                            type={selectedField.type}
                            value={
                                selectedField.default_value as CustomFieldValueT
                            }
                            options={
                                "options" in selectedField
                                    ? selectedField.options
                                    : []
                            }
                            // make optional because onChange is not needed here
                            onChange={() => {}}
                            disabled
                        />

                        <Button
                            variant="outlined"
                            onClick={handleAdd}
                            size="small"
                            disabled={copyLoading}
                        >
                            {t("projects.customFields.add")}
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={handleCopyAndAdd}
                            color="secondary"
                            size="small"
                            disabled={copyLoading}
                        >
                            {t("projects.customFields.makeCopyAndAdd")}
                        </Button>

                        <Divider flexItem />

                        <FieldTypeEditor customField={selectedField} readOnly />
                    </>
                ) : (
                    <Typography align="center" color="text.secondary">
                        {t("projects.customFields.clickToSelect")}
                    </Typography>
                )}
            </Stack>

            {copyDialogOpen && selectedField && (
                <CopyCustomFieldDialog
                    open={copyDialogOpen}
                    onSubmit={handleCopySubmit}
                    onClose={handleCopyDialogClose}
                    loading={copyLoading}
                />
            )}
        </Stack>
    );
};
