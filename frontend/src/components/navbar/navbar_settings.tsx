import {
    createContext,
    FC,
    PropsWithChildren,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";

type NavbarSettingsContextT = {
    action?: ReactNode | null;
    setAction: (value: ReactNode | undefined | null) => void;
};

const NavbarSettingsContext = createContext<NavbarSettingsContextT>({
    action: null,
    setAction: () => {
        throw "setAction not defined";
    },
});

export const NavbarSettingsContextProvider: FC<PropsWithChildren> = ({
    children,
}) => {
    const [action, setAction] = useState<ReactNode | undefined | null>(null);

    const contextValues = useMemo(() => {
        return { action, setAction };
    }, [action, setAction]);

    return (
        <NavbarSettingsContext.Provider value={contextValues}>
            {children}
        </NavbarSettingsContext.Provider>
    );
};

export const useNavbarSettings = () => useContext(NavbarSettingsContext);
