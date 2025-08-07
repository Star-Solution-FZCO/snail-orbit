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
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { AgileBoardT, CustomFieldGroupLinkT } from "shared/model/types";
import { CardCustomFieldsSelectPopover } from "./card_custom_fields_select_popover";

const ColumnTableRow: FC<{
    field: CustomFieldGroupLinkT;
    onRemove?: () => void;
    idx: number;
    controlsDisabled?: boolean;
}> = (data) => {
    const { onRemove, field, idx, controlsDisabled = false } = data;

    const { handleRef, ref } = useSortable({
        id: field.gid,
        index: idx,
        data: { field, idx },
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

            <TableCell>{field.name}</TableCell>

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

export const CardFieldsForm: FC<{ controlsDisabled?: boolean }> = ({
    controlsDisabled = false,
}) => {
    const { t } = useTranslation();

    const cardFieldsPopoverState = usePopupState({
        variant: "popover",
        popupId: "card-fields-select",
    });

    const { control } = useFormContext<AgileBoardT>();

    const customFields = useWatch({
        control,
        name: "card_fields",
    });

    const { append, remove, move } = useFieldArray<AgileBoardT>({
        control,
        name: "card_fields",
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
        <Stack component={Paper} sx={{ p: 1 }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <span>{t("cardFieldsForm.form.fields")}</span>

                {!controlsDisabled && (
                    <Button
                        size="small"
                        variant="text"
                        {...bindTrigger(cardFieldsPopoverState)}
                    >
                        {t("cardFieldsForm.fields.add")}
                    </Button>
                )}

                <CardCustomFieldsSelectPopover
                    {...bindPopover(cardFieldsPopoverState)}
                    value={customFields}
                    projectIds={projectIds}
                    onChange={handleOptionSelected}
                />
            </Stack>

            <TableContainer>
                <Table size="small">
                    <TableBody>
                        <DragDropProvider
                            onDragEnd={
                                controlsDisabled ? undefined : handleDragEnd
                            }
                        >
                            {customFields.map(
                                (field, idx) =>
                                    field && (
                                        <ColumnTableRow
                                            key={field.gid}
                                            field={field}
                                            idx={idx}
                                            onRemove={() => remove(idx)}
                                            controlsDisabled={controlsDisabled}
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
