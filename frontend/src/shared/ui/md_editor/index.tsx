import { useCallback, useEffect, useState, type FC } from "react";
import {
    EDITOR_VIEW_MODE_DEFAULT_VALUE,
    EDITOR_VIEW_MODE_KEY,
    EditorViewMode,
} from "shared/model/types/settings";
import { useLSState } from "shared/utils/helpers/local-storage";
import { MarkdownEditor } from "./editors/markdown";
import { VisualEditor } from "./editors/visual";
import { MDEditorProps } from "./types";

export const MDEditor: FC<MDEditorProps> = ({
    value = "",
    onChange,
    onBlur,
    onFocus,
    placeholder,
    readOnly = false,
    autoHeight,
    autoFocus,
}) => {
    const [mode, setMode] = useLSState<EditorViewMode>(
        EDITOR_VIEW_MODE_KEY,
        EDITOR_VIEW_MODE_DEFAULT_VALUE,
    );
    const [internalValue, setInternalValue] = useState(value);

    const handleChange = useCallback(
        (newValue: string) => {
            setInternalValue(newValue);
            onChange?.(newValue);
        },
        [onChange],
    );

    const handleModeChange = useCallback((newMode: EditorViewMode) => {
        setMode(newMode);
    }, []);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    if (mode === "visual") {
        return (
            <VisualEditor
                value={internalValue}
                placeholder={placeholder}
                mode={mode}
                onModeChange={handleModeChange}
                onChange={handleChange}
                onBlur={onBlur}
                onFocus={onFocus}
                readOnly={readOnly}
                autoHeight={autoHeight}
                autoFocus={autoFocus}
            />
        );
    }

    return (
        <MarkdownEditor
            value={internalValue}
            placeholder={placeholder}
            mode={mode}
            onModeChange={handleModeChange}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            readOnly={readOnly}
            autoHeight={autoHeight}
            autoFocus={autoFocus}
        />
    );
};
