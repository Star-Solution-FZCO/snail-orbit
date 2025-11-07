import type { FC } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./components";
import { MarkdownWrapper } from "./md_wrapper";

export const MarkdownRenderer: FC<{ content: string | null }> = ({
    content,
}) => {
    return (
        <MarkdownWrapper>
            <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={markdownComponents}
            >
                {content}
            </Markdown>
        </MarkdownWrapper>
    );
};
