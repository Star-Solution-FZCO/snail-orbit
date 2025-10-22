import { type FC } from "react";
import { EditorViewMode } from "shared/model/types/settings";
import { MarkdownEditorToolbar } from "./markdown_editor_toolbar";
import { VisualEditorToolbar } from "./visual_editor_toolbar";

interface IToolbarPluginProps {
    mode: EditorViewMode;
    onModeChange?: (mode: EditorViewMode) => void;
    onChange?: (value: string) => void;
}

export const ToolbarPlugin: FC<IToolbarPluginProps> = ({
    mode,
    onModeChange,
    onChange,
}) => {
    if (mode === "visual") {
        return (
            <VisualEditorToolbar
                mode={mode}
                onModeChange={onModeChange}
                onChange={onChange}
            />
        );
    }

    return (
        <MarkdownEditorToolbar
            mode={mode}
            onModeChange={onModeChange}
            onChange={onChange}
        />
    );
};
