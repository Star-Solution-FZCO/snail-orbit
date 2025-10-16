import { Link } from "@mui/material";
import type { FC } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { MarkdownWrapper } from "./md_wrapper";
import { MentionRenderer } from "./mention_renderer";

export const MarkdownRenderer: FC<{ content: string | null }> = ({
    content,
}) => {
    return (
        <MarkdownWrapper>
            <Markdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    a: ({ node: _, ...props }) => {
                        if (
                            typeof props.children === "string" &&
                            props.children.startsWith("@") &&
                            typeof props.href === "string" &&
                            !props.href.startsWith("http")
                        ) {
                            const userId = props.href;
                            const username = props.children.substring(1); // Remove @ prefix

                            if (userId && username) {
                                return (
                                    <MentionRenderer
                                        userId={userId}
                                        username={username}
                                    />
                                );
                            }
                        }

                        const maxLength = 50;

                        const children =
                            typeof props.children === "string" &&
                            props.children.length > maxLength
                                ? props.children.slice(0, maxLength) + "..."
                                : props.children;

                        return (
                            <Link
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {children}
                            </Link>
                        );
                    },
                }}
            >
                {content}
            </Markdown>
        </MarkdownWrapper>
    );
};
