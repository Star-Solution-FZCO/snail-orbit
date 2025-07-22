import {
    Button,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Paper,
    Popper,
    Select,
    Stack,
    Switch,
} from "@mui/material";
import {
    bindPopper,
    bindToggle,
    usePopupState,
} from "material-ui-popup-state/hooks";
import { useTranslation } from "react-i18next";
import { KanbanCollisionDetection } from "shared/ui/kanban/kanban.types";
import type { AgileBoardViewSettings } from "./agile_board_view_settings.types";

type Props = {
    value: AgileBoardViewSettings;
    onChange: (value: AgileBoardViewSettings) => void;
};

export const AgileBoardViewSettingsPopper = (props: Props) => {
    const { t } = useTranslation();
    const { value, onChange } = props;
    const popupState = usePopupState({
        variant: "popper",
        popupId: "agile-board-view-settings",
    });

    return (
        <>
            <Button size="small" {...bindToggle(popupState)}>
                {t("settings")}
            </Button>

            <Popper
                {...bindPopper(popupState)}
                sx={{ zIndex: 9999 }}
                placement="bottom-end"
            >
                <Paper sx={{ px: 2, py: 1 }}>
                    <Stack direction="column" gap={1}>
                        <FormControlLabel
                            label={t("Show custom fields")}
                            control={
                                <Switch
                                    size="small"
                                    checked={value.showCustomFields}
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            showCustomFields: e.target.checked,
                                        })
                                    }
                                />
                            }
                        />

                        <FormControlLabel
                            label={t("Show description")}
                            control={
                                <Switch
                                    size="small"
                                    checked={value.showDescription}
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            showDescription: e.target.checked,
                                        })
                                    }
                                />
                            }
                        />

                        <FormLabel>{t("Collision strategy")}</FormLabel>
                        <Select
                            value={value.collisionDetectionStrategy}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    collisionDetectionStrategy: e.target
                                        .value as KanbanCollisionDetection,
                                })
                            }
                            variant="outlined"
                            size="small"
                        >
                            <MenuItem value={KanbanCollisionDetection.Default}>
                                {t("Default")}
                            </MenuItem>
                            <MenuItem
                                value={
                                    KanbanCollisionDetection.ShapeIntersection
                                }
                            >
                                {t("Shape Intersection")}
                            </MenuItem>
                            <MenuItem
                                value={
                                    KanbanCollisionDetection.PointerIntersection
                                }
                            >
                                {t("Pointer Intersection")}
                            </MenuItem>
                        </Select>
                    </Stack>
                </Paper>
            </Popper>
        </>
    );
};
