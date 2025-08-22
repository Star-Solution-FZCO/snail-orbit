import {
    Box,
    debounce,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { groupCustomFields } from "modules/projects/utils";
import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { projectApi } from "shared/model";
import { ProjectT } from "shared/model/types";
import { toastApiError, useListQueryParams } from "shared/utils";
import { Bundle } from "./bundle";

interface IProjectAvailableCustomFieldListProps {
    project: ProjectT;
}

export const ProjectAvailableCustomFieldList: FC<
    IProjectAvailableCustomFieldListProps
> = ({ project }) => {
    const { t } = useTranslation();
    const { id: projectId } = project;

    const [listQueryParams, updateListQueryParams] = useListQueryParams();
    const [searchQuery, setSearchQuery] = useState("");

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

    const {
        data: customFields,
        isLoading,
        isFetching,
    } = projectApi.useListProjectAvailableCustomFieldsQuery({
        id: projectId,
        ...listQueryParams,
    });

    const [addProjectCustomField] =
        projectApi.useAddProjectCustomFieldMutation();

    const handleClickAddCustomField = (customFieldId: string) => {
        addProjectCustomField({ id: projectId, customFieldId })
            .unwrap()
            .then(() => {
                toast.success(t("projects.customFields.add.success"));
            })
            .catch(toastApiError);
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
        <Box display="flex" flexDirection="column" gap={1}>
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
                            count: customFields?.payload?.items?.length || 0,
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

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                overflow="auto"
                pr={1}
            >
                {bundles.map((bundle) => (
                    <Bundle
                        key={bundle.gid}
                        bundle={bundle}
                        onAddCustomFieldClick={handleClickAddCustomField}
                    />
                ))}
            </Box>
        </Box>
    );
};
