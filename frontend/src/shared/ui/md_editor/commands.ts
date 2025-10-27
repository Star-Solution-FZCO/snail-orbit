import { createCommand } from "lexical";

export const FORMAT_HEADING_COMMAND = createCommand<string>();

export const FORMAT_BOLD_COMMAND = createCommand<void>();
export const FORMAT_ITALIC_COMMAND = createCommand<void>();
export const FORMAT_STRIKETHROUGH_COMMAND = createCommand<void>();

export const INSERT_QUOTE_COMMAND = createCommand<void>();
export const FORMAT_CODE_COMMAND = createCommand<void>();
export const INSERT_LINK_COMMAND = createCommand<void>();
export const INSERT_HORIZONTAL_RULE_COMMAND = createCommand<void>();

export const INSERT_UNORDERED_LIST_COMMAND = createCommand<void>();
export const INSERT_ORDERED_LIST_COMMAND = createCommand<void>();
export const INSERT_CHECK_LIST_COMMAND = createCommand<void>();

export const INSERT_CODE_BLOCK_COMMAND = createCommand<void>();
export const INSERT_TABLE_COMMAND = createCommand<void>();
