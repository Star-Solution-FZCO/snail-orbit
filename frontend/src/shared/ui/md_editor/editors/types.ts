import { EditorViewMode } from "shared/model/types/settings";

export interface EditorProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    mode: EditorViewMode;
    onModeChange: (mode: EditorViewMode) => void;
    onChange?: (value: string) => unknown;
    onBlur?: (value: string) => unknown;
    onFocus?: (value: string) => unknown;
    readOnly?: boolean;
    autoHeight?: boolean;
    autoFocus?: boolean;
}
