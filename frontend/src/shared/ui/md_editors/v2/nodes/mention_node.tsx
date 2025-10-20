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
        email: string;
        username: string;
    },
    SerializedTextNode
>;

function convertMentionElement(
    domNode: HTMLElement,
): DOMConversionOutput | null {
    const textContent = domNode.textContent;
    const email = domNode.getAttribute("data-email");
    const username = domNode.getAttribute("data-username");

    if (textContent !== null && email !== null && username !== null) {
        const node = $createMentionNode(email, username);
        return {
            node,
        };
    }

    return null;
}

export class MentionNode extends TextNode {
    __email: string;
    __username: string;

    static getType(): string {
        return "mention";
    }

    static clone(node: MentionNode): MentionNode {
        return new MentionNode(
            node.__email,
            node.__username,
            node.__text,
            node.__key,
        );
    }

    static importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(
            serializedNode.email,
            serializedNode.username,
        );
        node.setTextContent(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    constructor(email: string, username: string, text?: string, key?: NodeKey) {
        super(text ?? `@${username}`, key);
        this.__email = email;
        this.__username = username;
    }

    exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            email: this.__email,
            username: this.__username,
            type: "mention",
            version: 1,
        };
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config);
        dom.className = "editor-mention";
        dom.setAttribute("data-email", this.__email);
        dom.setAttribute("data-username", this.__username);
        return dom;
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span");
        element.setAttribute("data-email", this.__email);
        element.setAttribute("data-username", this.__username);
        element.className = "editor-mention";
        element.textContent = this.__text;
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-email")) {
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

    getEmail(): string {
        return this.__email;
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
    email: string,
    username: string,
): MentionNode {
    const mentionNode = new MentionNode(email, username);
    mentionNode.setMode("segmented").toggleDirectionless();
    return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
    node: LexicalNode | null | undefined,
): node is MentionNode {
    return node instanceof MentionNode;
}
