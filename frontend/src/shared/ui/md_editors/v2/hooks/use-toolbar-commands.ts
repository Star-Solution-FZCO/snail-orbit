import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    LexicalEditor,
} from "lexical";
import { useCallback } from "react";
import {
    getLineInfo,
    isCheckListLine,
    isOrderedListLine,
    isQuoteLine,
    isUnorderedListLine,
    TABLE_CONTENT,
} from "../utils";

export const useToolbarCommands = (
    editor: LexicalEditor,
    setBlockType: (blockType: string) => void,
) => {
    const formatHeading = useCallback(
        (headingType: string) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const prefixes = {
                        h1: "# ",
                        h2: "## ",
                        h3: "### ",
                        paragraph: "",
                    };
                    const prefix =
                        prefixes[headingType as keyof typeof prefixes] ?? "";

                    const selectedText = selection.getTextContent();

                    if (selectedText.length === 0) {
                        if (headingType === "paragraph") {
                            return;
                        }

                        selection.insertText(prefix);

                        setTimeout(() => {
                            setBlockType("paragraph");
                        }, 0);
                        return;
                    }

                    const lines = selectedText.split("\n");
                    const newText = lines
                        .map((line) => {
                            const cleanLine = line.replace(/^#{1,6}\s*/, "");
                            return prefix ? `${prefix}${cleanLine}` : cleanLine;
                        })
                        .join("\n");

                    selection.insertText(newText);

                    setTimeout(() => {
                        setBlockType(headingType);
                    }, 0);
                }
            });
        },
        [editor, setBlockType],
    );

    const formatInlineText = useCallback(
        (formatPrefix: string, formatSuffix: string = formatPrefix) => {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    const selectedText = selection.getTextContent();

                    if (selectedText.length > 0) {
                        const lines = selectedText.split("\n");

                        const formattedLines = lines.map((line) => {
                            if (line.trim() === "") return line;

                            const listMatches = line.match(
                                /^(\s*(?:-|\d+\.|\-\s*\[\s*\])\s*)(.*)/,
                            );
                            if (listMatches) {
                                const [, listPrefix, content] = listMatches;
                                const trimmed = content.trim();

                                const escapedPrefix = formatPrefix.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&",
                                );
                                const escapedSuffix = formatSuffix.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&",
                                );
                                const formatPattern = new RegExp(
                                    `^${escapedPrefix}(.+?)${escapedSuffix}$`,
                                );

                                if (formatPattern.test(trimmed)) {
                                    const unwrapped = trimmed.replace(
                                        formatPattern,
                                        "$1",
                                    );
                                    return `${listPrefix}${unwrapped}`;
                                } else {
                                    return `${listPrefix}${formatPrefix}${content}${formatSuffix}`;
                                }
                            } else {
                                const escapedPrefix = formatPrefix.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&",
                                );
                                const escapedSuffix = formatSuffix.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&",
                                );
                                const formatPattern = new RegExp(
                                    `^${escapedPrefix}(.+?)${escapedSuffix}$`,
                                );

                                if (formatPattern.test(line.trim())) {
                                    return line.replace(formatPattern, "$1");
                                } else {
                                    return formatPrefix + line + formatSuffix;
                                }
                            }
                        });

                        const newText = formattedLines.join("\n");
                        selection.insertText(newText);
                    } else {
                        selection.insertText(`${formatPrefix}${formatSuffix}`);

                        const newSelection = $getSelection();
                        if ($isRangeSelection(newSelection)) {
                            const newAnchorNode = newSelection.anchor.getNode();
                            if ($isTextNode(newAnchorNode)) {
                                const newOffset =
                                    newSelection.anchor.offset -
                                    formatSuffix.length;
                                newSelection.setTextNodeRange(
                                    newAnchorNode,
                                    newOffset,
                                    newAnchorNode,
                                    newOffset,
                                );
                            }
                        }
                    }
                }
            });
        },
        [editor],
    );

    const insertAtLineStart = useCallback(
        (prefix: string) => {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    const selectedText = selection.getTextContent();

                    if (selectedText.length > 0) {
                        const lines = selectedText.split("\n");

                        const formattedLines = lines.map((line) => {
                            if (line.trim() === "") return line;

                            if (prefix === "- ") {
                                if (isUnorderedListLine(line)) {
                                    return line.replace(/^\s*-\s*/, "");
                                } else {
                                    return `- ${line}`;
                                }
                            } else if (prefix === "- [ ] ") {
                                if (isCheckListLine(line)) {
                                    return line.replace(
                                        /^\s*-\s*\[[\sx]\]\s*/,
                                        "",
                                    );
                                } else {
                                    return `- [ ] ${line}`;
                                }
                            } else if (prefix === "> ") {
                                if (isQuoteLine(line)) {
                                    return line.replace(/^\s*>\s*/, "");
                                } else {
                                    return `> ${line}`;
                                }
                            }

                            return line;
                        });

                        const newText = formattedLines.join("\n");
                        selection.insertText(newText);
                        return;
                    }

                    const anchorNode = selection.anchor?.getNode();

                    if ($isTextNode(anchorNode)) {
                        const textContent = anchorNode.getTextContent();
                        const offset = selection.anchor.offset;

                        if (
                            textContent.length === 0 ||
                            offset >= textContent.length
                        ) {
                            selection.insertText(`\n${prefix}`);
                            return;
                        }

                        const { lineStart, lineEnd, currentLine } = getLineInfo(
                            textContent,
                            offset,
                        );

                        if (
                            lineStart >= textContent.length ||
                            lineEnd > textContent.length
                        ) {
                            selection.insertText(`\n${prefix}`);
                            return;
                        }

                        let newLine: string;

                        if (prefix === "- ") {
                            if (isUnorderedListLine(currentLine)) {
                                newLine = currentLine.replace(/^\s*-\s*/, "");
                            } else {
                                newLine = `- ${currentLine}`;
                            }
                        } else if (prefix === "- [ ] ") {
                            if (isCheckListLine(currentLine)) {
                                newLine = currentLine.replace(
                                    /^\s*-\s*\[[\sx]\]\s*/,
                                    "",
                                );
                            } else {
                                newLine = `- [ ] ${currentLine}`;
                            }
                        } else if (prefix === "> ") {
                            if (isQuoteLine(currentLine)) {
                                newLine = currentLine.replace(/^\s*>\s*/, "");
                            } else {
                                newLine = `> ${currentLine}`;
                            }
                        } else {
                            newLine = currentLine;
                        }

                        try {
                            selection.setTextNodeRange(
                                anchorNode,
                                lineStart,
                                anchorNode,
                                lineEnd,
                            );
                            selection.insertText(newLine);
                        } catch (error) {
                            selection.insertText(`\n${prefix}`);
                        }
                    } else {
                        selection.insertText(`\n${prefix}`);
                    }
                }
            });
        },
        [editor],
    );

    const insertOrderedList = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const selectedText = selection.getTextContent();

                if (selectedText.length > 0) {
                    const lines = selectedText.split("\n");
                    let counter = 1;

                    const formattedLines = lines.map((line) => {
                        if (line.trim() === "") return line;

                        if (isOrderedListLine(line)) {
                            return line.replace(/^\s*\d+\.\s*/, "");
                        } else {
                            return `${counter++}. ${line}`;
                        }
                    });

                    const newText = formattedLines.join("\n");
                    selection.insertText(newText);
                    return;
                }

                const anchorNode = selection.anchor?.getNode();
                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();
                    const offset = selection.anchor.offset;

                    if (
                        textContent.length === 0 ||
                        offset >= textContent.length
                    ) {
                        selection.insertText("\n1. ");
                        return;
                    }

                    const { lineStart, lineEnd, currentLine } = getLineInfo(
                        textContent,
                        offset,
                    );

                    if (
                        lineStart >= textContent.length ||
                        lineEnd > textContent.length
                    ) {
                        selection.insertText("\n1. ");
                        return;
                    }

                    let newLine: string;
                    if (isOrderedListLine(currentLine)) {
                        newLine = currentLine.replace(/^\s*\d+\.\s*/, "");
                    } else {
                        newLine = `1. ${currentLine}`;
                    }

                    try {
                        selection.setTextNodeRange(
                            anchorNode,
                            lineStart,
                            anchorNode,
                            lineEnd,
                        );
                        selection.insertText(newLine);
                    } catch (error) {
                        selection.insertText("\n1. ");
                    }
                } else {
                    selection.insertText("\n1. ");
                }
            }
        });
    }, [editor]);

    const insertCodeBlock = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const selectedText = selection.getTextContent();

                if (selectedText.length === 0) {
                    selection.insertText("```\n\n```");
                    const newSelection = $getSelection();
                    if ($isRangeSelection(newSelection)) {
                        const newAnchorNode = newSelection.anchor.getNode();
                        if ($isTextNode(newAnchorNode)) {
                            const newOffset = newSelection.anchor.offset - 4;
                            newSelection.setTextNodeRange(
                                newAnchorNode,
                                newOffset,
                                newAnchorNode,
                                newOffset,
                            );
                        }
                    }
                } else {
                    const codeBlockPattern = /^```(?:\n)?([\s\S]*?)\n?```$/;
                    const isCodeBlock = codeBlockPattern.test(
                        selectedText.trim(),
                    );

                    let newText: string;
                    if (isCodeBlock) {
                        newText = selectedText
                            .replace(/^```(?:\n)?/, "")
                            .replace(/\n?```$/, "");
                    } else {
                        newText = `\`\`\`\n${selectedText}\n\`\`\``;
                    }

                    selection.insertText(newText);
                }
            }
        });
    }, [editor]);

    const insertInlineCode = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const selectedText = selection.getTextContent();

                if (selectedText.length === 0) {
                    selection.insertText("``");
                    const newSelection = $getSelection();
                    if ($isRangeSelection(newSelection)) {
                        const newAnchorNode = newSelection.anchor.getNode();
                        if ($isTextNode(newAnchorNode)) {
                            const newOffset = newSelection.anchor.offset - 1;
                            newSelection.setTextNodeRange(
                                newAnchorNode,
                                newOffset,
                                newAnchorNode,
                                newOffset,
                            );
                        }
                    }
                } else {
                    formatInlineText("`");
                }
            }
        });
    }, [editor, formatInlineText]);

    const insertLink = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const selectedText = selection.getTextContent();
                const linkText = selectedText || "";
                const markdownLink = `[${linkText}](http://)`;
                selection.insertText(markdownLink);
            }
        });
    }, [editor]);

    const insertTable = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                let insertText = TABLE_CONTENT;

                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();
                    const { currentLine } = getLineInfo(
                        textContent,
                        selection.anchor.offset,
                    );

                    if (
                        currentLine.trim() === "" ||
                        selection.anchor.offset === 0
                    ) {
                        insertText = TABLE_CONTENT.replace(/^\n/, "");
                    }
                } else {
                    insertText = TABLE_CONTENT.replace(/^\n/, "");
                }

                selection.insertText(insertText);
            }
        });
    }, [editor]);

    const insertHorizontalRule = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();

                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();
                    const { currentLine } = getLineInfo(
                        textContent,
                        selection.anchor.offset,
                    );

                    if (
                        currentLine.trim() === "" ||
                        selection.anchor.offset === 0
                    ) {
                        selection.insertText("---\n");
                    } else {
                        selection.insertText("\n---\n");
                    }
                } else {
                    selection.insertText("---\n");
                }
            }
        });
    }, [editor]);

    const insertQuote = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();

                if ($isTextNode(anchorNode)) {
                    const textContent = anchorNode.getTextContent();

                    if (textContent.length === 0) {
                        selection.insertText("> ");
                        return;
                    }

                    const { currentLine } = getLineInfo(
                        textContent,
                        selection.anchor.offset,
                    );

                    if (currentLine.trim() === "") {
                        selection.insertText("> ");
                        return;
                    }
                } else {
                    selection.insertText("> ");
                    return;
                }

                insertAtLineStart("> ");
            }
        });
    }, [editor, insertAtLineStart]);

    return {
        formatHeading,
        formatInlineText,
        insertAtLineStart,
        insertCodeBlock,
        insertInlineCode,
        insertHorizontalRule,
        insertLink,
        insertOrderedList,
        insertTable,
        insertQuote,
    };
};
