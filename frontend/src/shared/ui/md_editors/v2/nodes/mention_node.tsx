import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedTextNode,
    Spread,
} from "lexical";

import { $applyNodeReplacement, TextNode } from "lexical";

export type SerializedMentionNode = Spread<
    {
        userId: string;
        username: string;
    },
    SerializedTextNode
>;

function convertMentionElement(
    domNode: HTMLElement,
): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    const userId = domNode.getAttribute("data-user-id");
    const username = domNode.getAttribute("data-username");

    if (textContent !== null && userId !== null && username !== null) {
        const node = $createMentionNode(userId, username);
        return {
            node,
        };
    }

    return null;
}

export class MentionNode extends TextNode {
    __userId: string;
    __username: string;

    static getType(): string {
        return "mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(
            node.__userId,
            node.__username,
            node.__text,
            node.__key,
        );
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(
            serializedNode.userId,
            serializedNode.username,
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    constructor(
        userId: string,
        username: string,
        text?: string,
        key?: NodeKey,
    ) {
        super(text ?? `@${username}`, key);
        this.__userId = userId;
        this.__username = username;
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            userId: this.__userId,
            username: this.__username,
            type: "mention",
            version: 1,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.className = "editor-mention";
        dom.setAttribute("data-user-id", this.__userId);
        dom.setAttribute("data-username", this.__username);
        return dom;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-user-id", this.__userId);
        element.setAttribute("data-username", this.__username);
        element.className = "editor-mention";
        element.textContent = this.__text;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-user-id")) {
                    return null;
                }
                return {
                    conversion: convertMentionElement,
                    priority: 1,
                };
            },
        };
    }

    isTextEntity(): true {
        return true;
    }

    getUserId(): string {
        return this.__userId;
    }

    getUsername(): string {
        return this.__username;
    }

    canInsertTextBefore(): boolean {
        return false;
    }

    canInsertTextAfter(): boolean {
        return false;
    }

    isSegmented(): false {
        return false;
    }
}

export function $createMentionNode(
    userId: string,
    username: string,
): MentionNode {
    const mentionNode = new MentionNode(userId, username);
    mentionNode.setMode("segmented").toggleDirectionless();
    return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
    node: LexicalNode | null | undefined,
): node is MentionNode {
    return node instanceof MentionNode;
}
