import { type DragDropEventHandlers, DragDropProvider } from "@dnd-kit/react";
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
import type { FC, SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import {
    Controller,
    useFieldArray,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT } from "shared/model/types";
import { notEmpty } from "shared/utils/helpers/notEmpty";
import { getOptionKey, getOptionValue } from "../helpers/options";
import type { OptionT } from "../types/options.types";
import { ColumnSelectPopover } from "./columns_select_popover";
import { OptionsSelectPopover } from "./options_select_popover";

const ColumnTableRow: FC<{
    column: OptionT;
    onRemove?: () => void;
    idx: number;
}> = (data) => {
    const { onRemove, column, idx } = data;

    const { handleRef, ref } = useSortable({
        id: getOptionKey(column),
        index: idx,
        data: { column, idx },
    });

    return (
        <TableRow ref={ref}>
            <TableCell align="left" sx={{ flexGrow: 0 }} padding="checkbox">
                <IconButton size="medium" ref={handleRef}>
                    <DragHandle fontSize="inherit" />
                </IconButton>
            </TableCell>
            <TableCell>{getOptionValue(column)}</TableCell>
            <TableCell align="right">
                <IconButton size="small" color="error" onClick={onRemove}>
                    <DeleteIcon fontSize="inherit" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

export const ColumnsForm: FC = () => {
    const { t } = useTranslation();

    const columnSelectPopoverState = usePopupState({
        variant: "popover",
        popupId: "column-select",
    });

    const columnOptionsPopoverState = usePopupState({
        variant: "popover",
        popupId: "column-options-select",
    });

    const { control } = useFormContext<AgileBoardT>();

    const projects = useWatch({ control, name: "projects" });

    const field = useWatch({
        name: "columns.field",
        control,
    });

    const columns = useWatch({
        control,
        name: "columns.values",
    });

    const { append, remove, move } = useFieldArray<AgileBoardT>({
        control,
        name: "columns.values",
    });

    const selectedColumns = useMemo(
        () => columns?.filter(notEmpty) || [],
        [columns],
    );

    const projectIds = useMemo(
        () => projects.map((project) => project.id),
        [projects],
    );

    const handleOptionSelected = useCallback(
        (
            _: SyntheticEvent,
            value: OptionT | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (!value) return null;
            if (reason === "selectOption") {
                append({
                    id: getOptionKey(value),
                    value: getOptionValue(value),
                    color:
                        typeof value === "object" && "color" in value
                            ? value.color || undefined
                            : undefined,
                    is_archived: false,
                });
            }
        },
        [append],
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
            <Stack direction="row" justifyContent="space-between">
                <Controller
                    control={control}
                    name="columns.field"
                    render={({ field: { onChange, value } }) => (
                        <span>
                            {t("columns.describedBy")}:{" "}
                            <Button
                                {...bindTrigger(columnSelectPopoverState)}
                                variant="text"
                                size="small"
                            >
                                {value.name}
                            </Button>
                            <ColumnSelectPopover
                                {...bindPopover(columnSelectPopoverState)}
                                projectId={projectIds}
                                onChange={(_, value) => onChange(value)}
                            />
                        </span>
                    )}
                />

                <Button
                    variant="text"
                    size="small"
                    {...bindTrigger(columnOptionsPopoverState)}
                >
                    {t("columns.add")}
                </Button>

                <OptionsSelectPopover
                    {...bindPopover(columnOptionsPopoverState)}
                    value={selectedColumns}
                    onChange={handleOptionSelected}
                    fieldId={field.gid}
                />
            </Stack>

            <TableContainer>
                <Table size="small">
                    <TableBody>
                        <DragDropProvider onDragEnd={handleDragEnd}>
                            {columns.map(
                                (column, idx) =>
                                    column && (
                                        <ColumnTableRow
                                            key={getOptionKey(column)}
                                            column={column}
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
