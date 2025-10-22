import type { TextMatchTransformer } from "@lexical/markdown";
import {
    $createMentionNode,
    $isMentionNode,
    MentionNode,
} from "../nodes/mention_node";

export const MENTION: TextMatchTransformer = {
    dependencies: [MentionNode],
    export: (node) => {
        if (!$isMentionNode(node)) {
            return null;
        }

        const email = node.getEmail();
        const username = node.getUsername();

        return `[@${username}](${email})`;
    },
    importRegExp: /\[@([^\]]+)\]\(([^)]+)\)/,
    regExp: /\[@([^\]]+)\]\(([^)]+)\)$/,
    replace: (textNode, match) => {
        const [, username, email] = match;
        const mentionNode = $createMentionNode(email, username);
        textNode.replace(mentionNode);
    },
    trigger: "@",
    type: "text-match",
};
