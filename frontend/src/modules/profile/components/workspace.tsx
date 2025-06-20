import {
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    useColorScheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { setEditorMode, useAppDispatch, useAppSelector } from "shared/model";

export const Workspace = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const { mode: themeMode, setMode } = useColorScheme();

    const editorMode = useAppSelector((state) => state.shared.editor.mode);

    return (
        <Stack spacing={2} height={1}>
            <FormControl>
                <FormLabel id="theme-toggle">
                    {t("profile.workspace.theme")}
                </FormLabel>
                <RadioGroup
                    name="theme-toggle"
                    value={themeMode}
                    onChange={(event) =>
                        setMode(
                            event.target.value as "system" | "light" | "dark",
                        )
                    }
                    aria-labelledby="theme-toggle"
                    row
                >
                    <FormControlLabel
                        value="system"
                        control={<Radio />}
                        label={t("profile.workspace.theme.system")}
                    />
                    <FormControlLabel
                        value="light"
                        control={<Radio />}
                        label={t("profile.workspace.theme.light")}
                    />
                    <FormControlLabel
                        value="dark"
                        control={<Radio />}
                        label={t("profile.workspace.theme.dark")}
                    />
                </RadioGroup>
            </FormControl>

            <FormControl>
                <FormLabel id="editor-toggle">
                    {t("profile.workspace.editor")}
                </FormLabel>
                <RadioGroup
                    name="editor-toggle"
                    value={editorMode}
                    onChange={(event) =>
                        dispatch(
                            setEditorMode(
                                event.target.value as "ckeditor" | "lexical",
                            ),
                        )
                    }
                    aria-labelledby="editor-toggle"
                    row
                >
                    <FormControlLabel
                        value="ckeditor"
                        control={<Radio />}
                        label={t("profile.workspace.editor.ckeditor")}
                    />
                    <FormControlLabel
                        value="lexical"
                        control={<Radio />}
                        label={t("profile.workspace.editor.lexical")}
                    />
                </RadioGroup>
            </FormControl>
        </Stack>
    );
};
