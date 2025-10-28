import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { projectApi } from "shared/model";
import type { CustomFieldT, ProjectT } from "shared/model/types";

type AvailableCustomFieldsListProp1s = {
    project: ProjectT;
};

const AvailableCustomFieldsList: FC<AvailableCustomFieldsListProp1s> = ({
    project,
}) => {
    const { t } = useTranslation();
    const { custom_fields, card_fields } = project;

    const [updateProject] = projectApi.useUpdateProjectMutation();

    const filteredCustomFields = useMemo(() => {
        const usedFields = new Set(card_fields);
        return custom_fields.filter((field) => !usedFields.has(field.id));
    }, [custom_fields, card_fields]);

    return (
        <Box display="flex" flexDirection="column" gap={1} height={1}>
            <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="bold">
                    {t("projects.listView.remain", {
                        count: filteredCustomFields.length,
                    })}
                </Typography>
            </Box>

            <Divider flexItem />

            <Box
                display="flex"
                flexDirection="column"
                gap={1}
                flex="1 1 0"
                overflow="auto"
                pr={1}
            >
                {filteredCustomFields.map((field) => (
                    <Stack
                        direction="row"
                        key={field.id}
                        gap={1}
                        alignItems="center"
                    >
                        <IconButton
                            onClick={() =>
                                updateProject({
                                    id: project.slug,
                                    card_fields: [...card_fields, field.id],
                                })
                            }
                            size="small"
                        >
                            <AddIcon />
                        </IconButton>

                        <Typography flex={1} fontWeight="bold">
                            {field.name}
                        </Typography>
                        <Typography>{field.type}</Typography>
                    </Stack>
                ))}
            </Box>
        </Box>
    );
};

type ProjectListViewProps = {
    project: ProjectT;
};

export const ProjectListView: FC<ProjectListViewProps> = ({ project }) => {
    const { t } = useTranslation();
    const { card_fields, custom_fields } = project;

    const [updateProject] = projectApi.useUpdateProjectMutation();

    const fieldRows = useMemo(() => {
        const fieldsMap = new Map(
            custom_fields.map((field) => [field.id, field]),
        );
        return card_fields.map((id) => fieldsMap.get(id)).filter((el) => !!el);
    }, [card_fields, custom_fields]);

    const columns: GridColDef<CustomFieldT>[] = useMemo(
        () => [
            {
                field: "detach",
                headerName: "",
                sortable: false,
                resizable: false,
                width: 60,
                align: "center",
                renderCell: ({ row }) => (
                    <IconButton
                        onClick={(e) => {
                            e.stopPropagation();
                            updateProject({
                                id: project.slug,
                                card_fields: card_fields.filter(
                                    (el) => el !== row.id,
                                ),
                            });
                        }}
                        size="small"
                        color="error"
                    >
                        <RemoveIcon />
                    </IconButton>
                ),
            },
            {
                field: "name",
                headerName: t("projects.workflows.fields.name"),
                flex: 1,
            },
            {
                field: "type",
                headerName: t("type"),
                flex: 1,
            },
        ],
        [t, updateProject, project.slug, card_fields],
    );

    return (
        <Stack direction="row" gap={2} height={1}>
            <Stack flex={1} minHeight={0}>
                <DataGrid
                    sx={{ flex: "1 1 0" }}
                    columns={columns}
                    rows={fieldRows}
                    density="compact"
                    disableRowSelectionOnClick
                    disableColumnMenu
                />
            </Stack>

            <Box flex={1} height={1}>
                <AvailableCustomFieldsList project={project} />
            </Box>
        </Stack>
    );
};
