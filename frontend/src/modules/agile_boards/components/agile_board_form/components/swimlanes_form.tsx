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
import type { FC } from "react";
import { type SyntheticEvent, useCallback, useMemo } from "react";
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
import { OptionsSelectPopover } from "./options_select_popover";
import { SwimlanesSelectPopover } from "./swimlanes_select_popover";

const SwimlaneTableRow: FC<{
    swimlane: OptionT | null;
    onRemove?: () => void;
    idx: number;
    controlsDisabled?: boolean;
}> = (data) => {
    const { onRemove, swimlane, idx, controlsDisabled } = data;

    const { handleRef, ref } = useSortable({
        id: swimlane ? getOptionKey(swimlane) : "Empty",
        index: idx,
        data: { swimlane, idx },
        disabled: controlsDisabled,
    });

    return (
        <TableRow ref={ref}>
            <TableCell align="left" sx={{ flexGrow: 0 }} padding="checkbox">
                <IconButton
                    ref={handleRef}
                    sx={{ cursor: controlsDisabled ? "default" : "grab" }}
                    size="medium"
                    disabled={controlsDisabled}
                >
                    <DragHandle
                        sx={{
                            color: controlsDisabled
                                ? "action.disabled"
                                : "inherit",
                        }}
                        fontSize="inherit"
                    />
                </IconButton>
            </TableCell>
            <TableCell>
                {swimlane ? getOptionValue(swimlane) : "Empty"}
            </TableCell>
            <TableCell align="right">
                {!controlsDisabled && (
                    <IconButton size="small" color="error" onClick={onRemove}>
                        <DeleteIcon fontSize="inherit" />
                    </IconButton>
                )}
            </TableCell>
        </TableRow>
    );
};

export const SwimlanesForm: FC<{ controlsDisabled?: boolean }> = ({
    controlsDisabled = false,
}) => {
    const { t } = useTranslation();

    const swimlaneSelectPopoverState = usePopupState({
        variant: "popover",
        popupId: "swimlane-select",
    });

    const swimlaneOptionsPopoverState = usePopupState({
        variant: "popover",
        popupId: "swimlane-options-select",
    });

    const { control } = useFormContext<AgileBoardT>();

    const projects = useWatch({ control, name: "projects" });

    const field = useWatch({
        name: "swimlanes.field",
        control,
    });

    const swimlanes = useWatch({
        control,
        name: "swimlanes.values",
    });

    const { move, append, remove } = useFieldArray<AgileBoardT>({
        control,
        name: "swimlanes.values",
    });

    const selectedSwimlanes = useMemo(
        () => swimlanes?.filter(notEmpty) || [],
        [swimlanes],
    );

    const handleOptionSelected = useCallback(
        (
            _: SyntheticEvent,
            value: OptionT | null,
            reason: AutocompleteChangeReason,
        ) => {
            if (!value) return null;
            if (reason === "selectOption") {
                if (typeof value === "object" && "email" in value)
                    append(value);
                else
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

    const projectIds = useMemo(
        () => projects.map((project) => project.id),
        [projects],
    );

    return (
        <Stack component={Paper} sx={{ p: 1 }}>
            <Stack direction="row" justifyContent="space-between">
                <Controller
                    control={control}
                    name="swimlanes.field"
                    render={({ field: { onChange, value } }) => (
                        <span>
                            {t("swimlanes.describedBy")}:{" "}
                            <Button
                                {...(!controlsDisabled &&
                                    bindTrigger(swimlaneSelectPopoverState))}
                                sx={{
                                    cursor: controlsDisabled
                                        ? "auto"
                                        : "pointer",
                                }}
                                variant="text"
                                size="small"
                                disableRipple={controlsDisabled}
                            >
                                {value?.name || t("none")}
                            </Button>
                            <SwimlanesSelectPopover
                                {...bindPopover(swimlaneSelectPopoverState)}
                                projectId={projectIds}
                                onChange={(_, value) =>
                                    value?.gid === "none"
                                        ? onChange(null)
                                        : onChange(value)
                                }
                            />
                        </span>
                    )}
                />

                {!controlsDisabled && (
                    <Button
                        variant="text"
                        size="small"
                        disabled={!field?.gid}
                        {...bindTrigger(swimlaneOptionsPopoverState)}
                    >
                        {t("swimlanes.add")}
                    </Button>
                )}

                <OptionsSelectPopover
                    {...bindPopover(swimlaneOptionsPopoverState)}
                    value={selectedSwimlanes}
                    onChange={handleOptionSelected}
                    fieldId={field?.gid}
                />
            </Stack>

            {swimlanes && (
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            <DragDropProvider onDragEnd={handleDragEnd}>
                                {swimlanes.map((swimlane, idx) => (
                                    <SwimlaneTableRow
                                        key={
                                            swimlane
                                                ? getOptionKey(swimlane)
                                                : "Empty"
                                        }
                                        swimlane={swimlane}
                                        idx={idx}
                                        onRemove={() => remove(idx)}
                                        controlsDisabled={controlsDisabled}
                                    />
                                ))}
                            </DragDropProvider>
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Stack>
    );
};
