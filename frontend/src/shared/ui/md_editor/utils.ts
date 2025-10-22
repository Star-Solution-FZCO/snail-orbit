export const TABLE_CONTENT =
    "|   |   |   |\n| --- | --- | --- |\n|   |   |   |\n|   |   |   |\n|   |   |   |\n";

export const getLineInfo = (textContent: string, offset: number) => {
    const lines = textContent.split("\n");
    let currentOffset = 0;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // +1 для \n

        if (currentOffset + lineLength > offset) {
            lineIndex = i;
            break;
        }

        currentOffset += lineLength;
    }

    const lineStart = currentOffset;
    const currentLine = lines[lineIndex] || "";
    const lineEnd = lineStart + currentLine.length;

    return {
        lineStart,
        lineEnd,
        currentLine,
        lineIndex,
    };
};

export const detectBlockType = (line: string): string => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("### ")) {
        return "h3";
    } else if (trimmedLine.startsWith("## ")) {
        return "h2";
    } else if (trimmedLine.startsWith("# ")) {
        return "h1";
    } else {
        return "paragraph";
    }
};

export const checkFormatting = (
    textContent: string,
    minOffset: number,
    maxOffset: number,
    formatPrefix: string,
): boolean => {
    const beforeText = textContent.substring(
        Math.max(0, minOffset - formatPrefix.length),
        minOffset,
    );
    const afterText = textContent.substring(
        maxOffset,
        maxOffset + formatPrefix.length,
    );

    return beforeText === formatPrefix && afterText === formatPrefix;
};

export const isBoldText = (text: string): boolean => {
    const boldPattern = /\*\*(.*?)\*\*/g;
    const matches = text.match(boldPattern);

    if (!matches) return false;

    const textWithoutBold = text.replace(boldPattern, "$1");
    const boldContent = matches.join("").replace(/\*\*/g, "");

    return textWithoutBold.trim() === boldContent.trim();
};

export const isItalicText = (text: string): boolean => {
    if (isBoldText(text)) return false;

    const italicPattern = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;
    const matches = text.match(italicPattern);

    if (!matches) return false;

    const textWithoutItalic = text.replace(italicPattern, "$1");
    const italicContent = matches.join("").replace(/(?<!\*)\*(?!\*)/g, "");

    return textWithoutItalic.trim() === italicContent.trim();
};

export const isStrikethroughText = (text: string): boolean => {
    const strikethroughPattern = /~~(.*?)~~/g;
    const matches = text.match(strikethroughPattern);

    if (!matches) return false;

    const textWithoutStrike = text.replace(strikethroughPattern, "$1");
    const strikeContent = matches.join("").replace(/~~/g, "");

    return textWithoutStrike.trim() === strikeContent.trim();
};

export const isCodeText = (text: string): boolean => {
    const codePattern = /`([^`]+)`/g;
    const matches = text.match(codePattern);

    if (!matches) return false;

    const textWithoutCode = text.replace(codePattern, "$1");
    const codeContent = matches.join("").replace(/`/g, "");

    return textWithoutCode.trim() === codeContent.trim();
};

export const isUnorderedListLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
        trimmed.startsWith("- ") &&
        !trimmed.startsWith("- [ ]") &&
        !trimmed.startsWith("- [x]") &&
        !trimmed.startsWith("- [X]")
    );
};

export const isOrderedListLine = (line: string): boolean => {
    return /^\s*\d+\.\s+/.test(line);
};

export const isCheckListLine = (line: string): boolean => {
    return /^\s*-\s*\[[\sx]\]\s+/.test(line);
};

export const isQuoteLine = (line: string): boolean => {
    return line.trim().startsWith("> ");
};

export const analyzeSelectedText = (text: string) => {
    if (!text) {
        return {
            isBold: false,
            isItalic: false,
            isStrikethrough: false,
            isCode: false,
            isUnorderedList: false,
            isOrderedList: false,
            isCheckList: false,
            isQuote: false,
            isCodeBlock: false,
            isTable: false,
        };
    }

    const lines = text.split("\n").filter((line) => line.trim() !== "");

    return {
        isBold: isBoldText(text),
        isItalic: isItalicText(text),
        isStrikethrough: isStrikethroughText(text),
        isCode: isCodeText(text),
        isUnorderedList: lines.length > 0 && lines.every(isUnorderedListLine),
        isOrderedList: lines.length > 0 && lines.every(isOrderedListLine),
        isCheckList: lines.length > 0 && lines.every(isCheckListLine),
        isQuote: lines.length > 0 && lines.every(isQuoteLine),
        isCodeBlock: /```[\s\S]*```/.test(text),
        isTable:
            text.includes("|") &&
            lines.some(
                (line) => line.includes("|") && line.split("|").length > 2,
            ),
    };
};
