import { Link } from "@mui/material";
import type { Components } from "react-markdown";
import { MentionRenderer } from "./mention_renderer";

export const markdownComponents: Components = {
    a: ({ node: _, ...props }) => {
        if (
            typeof props.children === "string" &&
            props.children.startsWith("@") &&
            typeof props.href === "string" &&
            !props.href.startsWith("http")
        ) {
            const userId = props.href;
            const username = props.children.substring(1);

            if (userId && username) {
                return <MentionRenderer userId={userId} username={username} />;
            }
        }

        const maxLength = 50;

        const children =
            typeof props.children === "string" &&
            props.children.length > maxLength
                ? props.children.slice(0, maxLength) + "..."
                : props.children;

        return (
            <Link {...props} target="_blank" rel="noopener noreferrer">
                {children}
            </Link>
        );
    },
    input: ({ node: _, ...props }) => {
        if (props.type === "checkbox") {
            const { disabled: _disabled, ...restProps } = props;
            return <input {...restProps} />;
        }
        return <input {...props} />;
    },
};
