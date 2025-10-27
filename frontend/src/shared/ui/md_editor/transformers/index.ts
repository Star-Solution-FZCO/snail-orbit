import {
    $convertFromMarkdownString,
    $convertToMarkdownString,
    CHECK_LIST,
    TRANSFORMERS as LEXICAL_TRANSFORMERS,
} from "@lexical/markdown";
import {
    $createTableCellNode,
    $createTableNode,
    $createTableRowNode,
    $isTableCellNode,
    $isTableNode,
    $isTableRowNode,
    TableCellHeaderStates,
    TableCellNode,
    TableNode,
    TableRowNode,
} from "@lexical/table";
import { $isParagraphNode, $isTextNode, LexicalNode } from "lexical";

import { ElementTransformer } from "@lexical/markdown";
import {
    $createHorizontalRuleNode,
    $isHorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { MENTION } from "./mention_transformer";

export const HR: ElementTransformer = {
    dependencies: [],
    export: (node) => {
        return $isHorizontalRuleNode(node) ? "---" : null;
    },
    regExp: /^---\s*$/,
    replace: (parentNode, _1, _2, isImport) => {
        const line = $createHorizontalRuleNode();

        if (isImport || parentNode.getNextSibling() != null) {
            parentNode.replace(line);
        } else {
            parentNode.insertBefore(line);
        }

        line.selectNext();
    },
    type: "element",
};

const TABLE_ROW_REG_EXP = /^(?:\|)(.*)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;

export const TABLE: ElementTransformer = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node: LexicalNode) => {
        if (!$isTableNode(node)) {
            return null;
        }

        const output: string[] = [];

        for (const row of node.getChildren()) {
            const rowOutput = [];
            if (!$isTableRowNode(row)) {
                continue;
            }

            let isHeaderRow = false;
            for (const cell of row.getChildren()) {
                if ($isTableCellNode(cell)) {
                    const cellContent = $convertToMarkdownString(
                        TRANSFORMERS,
                        cell,
                    ).replace(/\n/g, "\\n");
                    rowOutput.push(cellContent.trim() || " ");
                    if (cell.__headerState === TableCellHeaderStates.ROW) {
                        isHeaderRow = true;
                    }
                }
            }

            output.push(`| ${rowOutput.join(" | ")} |`);
            if (isHeaderRow) {
                output.push(`| ${rowOutput.map((_) => "---").join(" | ")} |`);
            }
        }

        return output.join("\n");
    },
    regExp: TABLE_ROW_REG_EXP,
    replace: (parentNode, _1, match) => {
        if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
            const table = parentNode.getPreviousSibling();
            if (!table || !$isTableNode(table)) {
                return;
            }

            const rows = table.getChildren();
            const lastRow = rows[rows.length - 1];
            if (!lastRow || !$isTableRowNode(lastRow)) {
                return;
            }

            lastRow.getChildren().forEach((cell) => {
                if (!$isTableCellNode(cell)) {
                    return;
                }
                cell.setHeaderStyles(
                    TableCellHeaderStates.ROW,
                    TableCellHeaderStates.ROW,
                );
            });

            parentNode.remove();
            return;
        }

        const matchCells = mapToTableCells(match[0]);

        if (matchCells == null) {
            return;
        }

        const rows = [matchCells];
        let sibling = parentNode.getPreviousSibling();
        let maxCells = matchCells.length;

        while (sibling) {
            if (!$isParagraphNode(sibling)) {
                break;
            }

            if (sibling.getChildrenSize() !== 1) {
                break;
            }

            const firstChild = sibling.getFirstChild();

            if (!$isTextNode(firstChild)) {
                break;
            }

            const cells = mapToTableCells(firstChild.getTextContent());

            if (cells == null) {
                break;
            }

            maxCells = Math.max(maxCells, cells.length);
            rows.unshift(cells);
            const previousSibling = sibling.getPreviousSibling();
            sibling.remove();
            sibling = previousSibling;
        }

        const table = $createTableNode();

        for (const cells of rows) {
            const tableRow = $createTableRowNode();
            table.append(tableRow);

            for (let i = 0; i < maxCells; i++) {
                tableRow.append(
                    i < cells.length ? cells[i] : $createTableCell(""),
                );
            }
        }

        const previousSibling = parentNode.getPreviousSibling();
        if (
            $isTableNode(previousSibling) &&
            getTableColumnsSize(previousSibling) === maxCells
        ) {
            previousSibling.append(...table.getChildren());
            parentNode.remove();
        } else {
            parentNode.replace(table);
        }

        table.selectEnd();
    },
    type: "element",
};

function getTableColumnsSize(table: TableNode) {
    const row = table.getFirstChild();
    return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const $createTableCell = (textContent: string): TableCellNode => {
    textContent = textContent.replace(/\\n/g, "\n");
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
    $convertFromMarkdownString(textContent, TRANSFORMERS, cell);
    return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
    const match = textContent.match(TABLE_ROW_REG_EXP);
    if (!match || match[1] === undefined) {
        return null;
    }
    return match[1]
        .split("|")
        .map((text) => $createTableCell(text.trim() || " "));
};

export const TRANSFORMERS = [
    TABLE,
    HR,
    CHECK_LIST,
    MENTION,
    ...LEXICAL_TRANSFORMERS,
];
