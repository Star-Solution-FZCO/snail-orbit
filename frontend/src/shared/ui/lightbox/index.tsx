import { FC, useCallback, useMemo, useState } from "react";
import { LBFile, LightboxContext, useLightbox } from "./context";
import { LightboxModal } from "./modal";

const initialFile: LBFile = {
    id: "",
    src: "",
    name: "",
    size: 0,
    content_type: "image/png",
};

export const Lightbox: FC<React.PropsWithChildren> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<LBFile[]>([]);
    const [currentFile, setCurrentFile] = useState<LBFile>(initialFile);
    const [index, setIndex] = useState(0);

    const load = useCallback((files: LBFile[]) => {
        setFiles(files.filter((f) => f.content_type.startsWith("image/")));
        setIndex(0);
        setCurrentFile(files[0] ?? initialFile);
    }, []);

    const open = useCallback(
        (file: LBFile) => {
            setCurrentFile(file);
            setIndex((prev) => {
                const i = files.findIndex((f) => f.id === file.id);
                return i !== -1 ? i : prev;
            });
            setIsOpen(true);
        },
        [files],
    );

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const clear = useCallback(() => {
        setFiles([]);
        setCurrentFile(initialFile);
        setIndex(0);
    }, []);

    const next = useCallback(() => {
        setIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % files.length;
            setCurrentFile(files[newIndex]);
            return newIndex;
        });
    }, [files]);

    const prev = useCallback(() => {
        setIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + files.length) % files.length;
            setCurrentFile(files[newIndex]);
            return newIndex;
        });
    }, [files]);

    const select = useCallback(
        (newIndex: number) => {
            if (newIndex >= 0 && newIndex < files.length) {
                setIndex(newIndex);
                setCurrentFile(files[newIndex]);
                setIsOpen(true);
            }
        },
        [files],
    );

    const value = useMemo(
        () => ({
            isOpen,
            files,
            currentFile,
            index,
            load,
            open,
            close,
            clear,
            next,
            prev,
            select,
        }),
        [
            isOpen,
            files,
            currentFile,
            index,
            load,
            open,
            close,
            clear,
            next,
            prev,
            select,
        ],
    );

    return (
        <LightboxContext value={value}>
            {children}

            <LightboxModal />
        </LightboxContext>
    );
};

export { useLightbox };
