import { createContext, useContext } from "react";

export type LBFile = {
    id: string;
    src: string;
    name: string;
    size: number;
    content_type: string;
};

export interface ILightboxContext {
    isOpen: boolean;
    files: LBFile[];
    currentFile: LBFile;
    index: number;
    load: (files: LBFile[]) => void;
    open: (file: LBFile) => void;
    close: () => void;
    clear: () => void;
    next: () => void;
    prev: () => void;
    select: (index: number) => void;
}

export const LightboxContext = createContext<ILightboxContext | undefined>(
    undefined,
);

export const useLightbox = () => {
    const ctx = useContext(LightboxContext);

    if (!ctx)
        throw new Error("useLightbox must be used within LightboxContext");

    return ctx;
};
