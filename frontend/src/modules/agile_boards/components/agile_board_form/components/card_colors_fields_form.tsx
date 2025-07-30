import type { DragDropEventHandlers } from "@dnd-kit/react";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { DragHandle } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    type AutocompleteChangeReason,
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
} from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import type { FC } from "react";
import { type SyntheticEvent, useCallback, useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT, CustomFieldGroupLinkT } from "shared/model/types";
import { CardColorFieldsSelectPopover } from "./card_color_fields_select_popover";

const ColumnTableRow: FC<{
    field: CustomFieldGroupLinkT;
    onRemove?: () => void;
    idx: number;
}> = (data) => {
    const { onRemove, field, idx } = data;

    const { handleRef, ref } = useSortable({
        id: field.gid,
        index: idx,
        data: { field, idx },
    });

    return (
        <TableRow ref={ref}>
            <TableCell align="left" sx={{ flexGrow: 0 }} padding="checkbox">
                <IconButton size="medium" ref={handleRef}>
                    <DragHandle fontSize="inherit" />
                </IconButton>
            </TableCell>
            <TableCell>{field.name}</TableCell>
            <TableCell align="right">
                <IconButton size="small" color="error" onClick={onRemove}>
                    <DeleteIcon fontSize="inherit" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

export const CardColorsFieldsForm: FC = () => {
    const { t } = useTranslation();

    const cardColorFieldsPopoverState = usePopupState({
        variant: "popover",
        popupId: "card-color-fields-select",
    });

    const { control } = useFormContext<AgileBoardT>();

    const colorFields = useWatch({
        control,
        name: "card_colors_fields",
    });

    const { append, remove, move } = useFieldArray<AgileBoardT>({
        control,
        name: "card_colors_fields",
    });

    const selectedProjects = useWatch({ control, name: "projects" });

    const handleOptionSelected = useCallback(
        (
            _: SyntheticEvent,
            value: CustomFieldGroupLinkT | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (value && reason === "selectOption") {
                append(value);
            }
        },
        [append],
    );

    const projectIds = useMemo(
        () => selectedProjects.map((project) => project.id),
        [selectedProjects],
    );

    const handleDragEnd = useCallback<DragDropEventHandlers["onDragEnd"]>(
        (event) => {
            const { operation, canceled } = event;
            const { source, target } = operation;

            if (canceled || !source || !target || !isSortable(source)) return;

            const from = source.sortable.initialIndex;
            const to = source.sortable.index;
            move(from, to);
        },
        [move],
    );

    return (
        <Stack gap={1} component={Paper} sx={{ p: 1 }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <span>{t("cardColorFieldsForm.form.fields")}</span>

                <Button
                    size="small"
                    variant="text"
                    {...bindTrigger(cardColorFieldsPopoverState)}
                >
                    {t("cardColorFieldsForm.fields.add")}
                </Button>

                <CardColorFieldsSelectPopover
                    {...bindPopover(cardColorFieldsPopoverState)}
                    value={colorFields}
                    projectIds={projectIds}
                    onChange={handleOptionSelected}
                />
            </Stack>

            <TableContainer>
                <Table size="small">
                    <TableBody>
                        <DragDropProvider onDragEnd={handleDragEnd}>
                            {colorFields.map(
                                (field, idx) =>
                                    field && (
                                        <ColumnTableRow
                                            key={field.gid}
                                            field={field}
                                            idx={idx}
                                            onRemove={() => remove(idx)}
                                        />
                                    ),
                            )}
                        </DragDropProvider>
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};
