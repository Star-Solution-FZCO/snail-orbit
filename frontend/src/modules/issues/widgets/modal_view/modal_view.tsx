import type { FC } from "react";
import type { IssueModalViewProps } from "./modal_view.types";
import { ModalViewDraft } from "./modal_view_draft";
import { ModalViewIssue } from "./modal_view_issue";

export const IssueModalView: FC<IssueModalViewProps> = (props) => {
    const { open, id, onClose, isDraft } = props;

    if (!isDraft)
        return <ModalViewIssue open={open} onClose={onClose} id={id} />;
    else return <ModalViewDraft open={open} onClose={onClose} id={id} />;
};

export default IssueModalView;
