export type IssueLinkMode = "short" | "long";
export const ISSUE_LINK_MODE_KEY = "ISSUE_LINK_MODE" as const;
export const ISSUE_LINK_MODE_DEFAULT_VALUE: IssueLinkMode = "short" as const;

export type EditorMode = "ckeditor" | "lexical";
export const EDITOR_MODE_KEY = "EDITOR_MODE" as const;
export const EDITOR_MODE_DEFAULT_VALUE: EditorMode = "ckeditor" as const;
