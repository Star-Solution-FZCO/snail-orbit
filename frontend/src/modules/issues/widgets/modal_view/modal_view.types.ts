type ModalViewCommonProps = {
    open: boolean;
    id: string;
    onClose?: () => void;
};

export type ModalViewIssueProps = ModalViewCommonProps;

export type ModalViewDraftProps = ModalViewCommonProps;

export type IssueModalViewProps = ModalViewCommonProps & {
    isDraft?: boolean;
};
