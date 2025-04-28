import {
    type FC,
    lazy,
    type PropsWithChildren,
    Suspense,
    useCallback,
    useMemo,
    useRef,
    useState,
} from "react";
import { issueApi } from "shared/model";
import type { IssueModalViewContextType } from "./modal_view.types";
import { IssueModalViewContext } from "./modal_view_context";
import { ModalViewLoader } from "./modal_view_loader";

const IssueModalView = lazy(() => import("./modal_view"));

export const IssueModalViewContextProvider: FC<PropsWithChildren> = ({
    children,
}) => {
    const [createDraft] = issueApi.useCreateDraftMutation();
    const awaitingRef = useRef<boolean>(false);

    const [open, setOpen] = useState<boolean>(false);
    const [id, setId] = useState<string | null>(null);
    const [isDraft, setIsDraft] = useState(false);

    const handleOpenIssueModal = useCallback(
        (id: string, isDraft?: boolean) => {
            setId(id);
            setIsDraft(isDraft || false);
            setOpen(true);
        },
        [],
    );

    const handleClose = useCallback(() => {
        setOpen(false);
        // Костыль, надо как-то поправить
        setTimeout(() => setId(null), 300);
    }, []);

    const handleCreateAndOpenIssueModal = useCallback(() => {
        if (awaitingRef.current) return;
        awaitingRef.current = true;
        createDraft()
            .unwrap()
            .then((resp) => handleOpenIssueModal(resp.payload.id, true))
            .finally(() => {
                awaitingRef.current = false;
            });
    }, [createDraft, handleOpenIssueModal]);

    const value = useMemo<IssueModalViewContextType>(
        () => ({
            openIssueModal: handleOpenIssueModal,
            createAndOpenIssueModal: handleCreateAndOpenIssueModal,
        }),
        [handleOpenIssueModal, handleCreateAndOpenIssueModal],
    );

    return (
        <IssueModalViewContext.Provider value={value}>
            {children}
            {id && (
                <Suspense fallback={<ModalViewLoader open />}>
                    <IssueModalView
                        id={id}
                        open={open}
                        isDraft={isDraft}
                        onClose={handleClose}
                    />
                </Suspense>
            )}
        </IssueModalViewContext.Provider>
    );
};
