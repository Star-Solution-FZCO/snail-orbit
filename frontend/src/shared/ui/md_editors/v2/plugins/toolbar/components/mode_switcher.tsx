import {
    ToggleButton as MuiToggleButton,
    Stack,
    ToggleButtonGroup,
    Tooltip,
    styled,
} from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { EditorViewMode } from "shared/model/types/settings";

const ToggleButton = styled(MuiToggleButton)(({ theme }) => ({
    textTransform: "none",
    padding: theme.spacing(0, 1),
    height: "32px",
    "&.Mui-selected": {
        color: theme.palette.primary.dark,
    },
}));

interface ModeSwitcherProps {
    mode: EditorViewMode;
    onChange: (mode: EditorViewMode) => void;
}

export const ModeSwitcher: FC<ModeSwitcherProps> = ({ mode, onChange }) => {
    const { t } = useTranslation();

    return (
        <Stack direction="row">
            <ToggleButtonGroup
                value={mode}
                onChange={(_, value) => {
                    if (value !== null) {
                        onChange(value);
                    }
                }}
                size="small"
                exclusive
            >
                <Tooltip title={t("editor.toolbar.mode.visual.tooltip")}>
                    <ToggleButton value="visual">
                        {t("editor.toolbar.mode.visual")}
                    </ToggleButton>
                </Tooltip>

                <Tooltip title={t("editor.toolbar.mode.markdown.tooltip")}>
                    <ToggleButton value="markdown">
                        {t("editor.toolbar.mode.markdown")}
                    </ToggleButton>
                </Tooltip>
            </ToggleButtonGroup>
        </Stack>
    );
};
