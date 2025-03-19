import {
    createContext,
    FC,
    lazy,
    PropsWithChildren,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import { issueApi } from "store";

const IssueModalView = lazy(() => import("./modal_view"));

type IssueModalViewContextType = {
    openIssueModal: (id: string, isDraft?: boolean) => void;
    createAndOpenIssueModal: () => void;
};

const noFunc = () => {
    throw new Error("No provider");
};

const IssueModalViewContext = createContext<IssueModalViewContextType>({
    createAndOpenIssueModal: noFunc,
    openIssueModal: noFunc,
});

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

    const handleCreateAndOpenIssueModal = useCallback(() => {
        awaitingRef.current = true;
        createDraft()
            .unwrap()
            .then((resp) => handleOpenIssueModal(resp.payload.id, true))
            .finally(() => {
                awaitingRef.current = false;
            });
    }, []);

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
                <IssueModalView
                    id={id}
                    open={open}
                    isDraft={isDraft}
                    onClose={() => setOpen(false)}
                />
            )}
        </IssueModalViewContext.Provider>
    );
};

export const useIssueModalView = () => useContext(IssueModalViewContext);
