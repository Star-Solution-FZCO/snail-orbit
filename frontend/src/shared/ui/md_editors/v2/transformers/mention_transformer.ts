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

        const userId = node.getUserId();
        const username = node.getUsername();

        return `[@${username}](${userId})`;
    },
    importRegExp: /\[@([^\]]+)\]\(([^)]+)\)/,
    regExp: /\[@([^\]]+)\]\(([^)]+)\)$/,
    replace: (textNode, match) => {
        const [, username, userId] = match;
        const mentionNode = $createMentionNode(userId, username);
        textNode.replace(mentionNode);
    },
    trigger: "@",
    type: "text-match",
};
