import type { FC } from "react";
import { useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./components";
import { MarkdownWrapper } from "./md_wrapper";

type MarkdownRendererProps = {
    content: string | null;
    onContentChange?: (newContent: string) => void;
    editable?: boolean;
};

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({
    content,
    onContentChange,
    editable = false,
}) => {
    const handleCheckboxChange = useCallback(
        (event: React.MouseEvent<HTMLInputElement>) => {
            if (!editable || !onContentChange || !content) return;

            event.preventDefault();

            const checkbox = event.target as HTMLInputElement;

            const allCheckboxes = Array.from(
                checkbox
                    .closest(".markdown-wrapper")
                    ?.querySelectorAll('input[type="checkbox"]') || [],
            );
            const checkboxIndex = allCheckboxes.indexOf(checkbox);

            const lines = content.split("\n");
            let currentCheckboxIndex = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const matches = line.match(/^(\s*)[-*+]\s*\[([ xX])\]/);

                if (matches) {
                    if (currentCheckboxIndex === checkboxIndex) {
                        const currentState = matches[2];
                        const newState = currentState === " " ? "x" : " ";
                        const newLine = line.replace(
                            /([-*+]\s*\[)([ xX])(\])/,
                            `$1${newState}$3`,
                        );
                        lines[i] = newLine;
                        break;
                    }
                    currentCheckboxIndex++;
                }
            }

            const newContent = lines.join("\n");
            onContentChange(newContent);
        },
        [content, onContentChange, editable],
    );

    const wrapperProps = useMemo(
        () => ({
            className: "markdown-wrapper",
            onClick: (e: React.MouseEvent) => {
                const target = e.target as HTMLElement;
                if (
                    target.tagName === "INPUT" &&
                    (target as HTMLInputElement).type === "checkbox"
                ) {
                    handleCheckboxChange(
                        e as React.MouseEvent<HTMLInputElement>,
                    );
                }
            },
        }),
        [handleCheckboxChange],
    );

    return (
        <MarkdownWrapper {...wrapperProps}>
            <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={markdownComponents}
            >
                {content}
            </Markdown>
        </MarkdownWrapper>
    );
};
