export type IssueLinkMode = "short" | "long";
export const ISSUE_LINK_MODE_KEY = "ISSUE_LINK_MODE" as const;
export const ISSUE_LINK_MODE_DEFAULT_VALUE: IssueLinkMode = "short" as const;

export type EditorViewMode = "visual" | "markdown";
export const EDITOR_VIEW_MODE_KEY = "EDITOR_VIEW_MODE" as const;
export const EDITOR_VIEW_MODE_DEFAULT_VALUE: EditorViewMode = "visual" as const;
