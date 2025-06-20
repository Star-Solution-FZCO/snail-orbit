export interface IMDEditorProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    onChange?: (value: string) => unknown;
    onBlur?: (value: string) => unknown;
    onFocus?: (value: string) => unknown;
    readOnly?: boolean;
    autoHeight?: boolean;
    autoFocus?: boolean;
}
