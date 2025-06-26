import { Box } from "@mui/material";
import type { FC } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const MarkdownRenderer: FC<{ content: string | null }> = ({
    content,
}) => {
    return (
        <Box
            sx={(theme) => ({
                "& .markdown-body": {
                    backgroundColor: "inherit",
                    color: theme.palette.text.primary,
                    wordBreak: "break-word",
                    fontSize: "0.875rem",
                    "& code": {
                        whiteSpace: "pre-wrap",
                    },
                },
            })}
        >
            <Markdown
                className="markdown-body"
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node: _, ...props }) => {
                        const maxLength = 50;

                        const children =
                            typeof props.children === "string" &&
                            props.children.length > maxLength
                                ? props.children.slice(0, maxLength) + "..."
                                : props.children;

                        return (
                            <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {children}
                            </a>
                        );
                    },
                }}
            >
                {content}
            </Markdown>
        </Box>
    );
};
